import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cloudConfigured,
  createRow,
  getSession,
  getUser,
  onAuthChange,
  pull,
  pushCas,
  pullPublic,
  pushOnUnload,
  signOut
} from './supabaseSync.js'
import { mergeBlobs, stable } from './merge.js'

// Sync engine on top of the offline-first store.
//
// One jsonb blob per user, but the blob is never swapped wholesale: local and
// remote are merged record by record (see merge.js), so edits to different
// trainers on different devices all survive and nothing has to be asked. The
// merged result goes back to both sides – down into the store when it differs
// from what we hold, and up to the server when it differs from the row.
//
// It runs on its own, without a button: at startup, every 2 minutes, when the
// app comes back to the foreground, a couple of seconds after an edit, and once
// more while the page is going away.
//
// state: 'off' | 'signedOut' | 'offline' | 'syncing' | 'synced' | 'error'
//        | 'viewing'  - signed out, but a shared row was found and is being
//                       read; the store is read-only in this mode.

const PUSH_DEBOUNCE = 2000
const SYNC_INTERVAL = 120000 // full reconcile every 2 minutes
const LS_REMOTE_AT = 'ewl737:sync:remoteAt'
const LS_PUSHED_AT = 'ewl737:sync:pushedAt'

const read = (k) => { try { return localStorage.getItem(k) } catch (_) { return null } }
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch (_) { /* ignore */ } }

export function useCloudSync(data, applyRemote) {
  const [state, setState] = useState(cloudConfigured ? 'signedOut' : 'off')
  const [user, setUser] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [error, setError] = useState(null)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  // Whether the first auth answer is in. Everything that branches on "is there
  // a user" has to wait for it: `user` is null for the first few hundred
  // milliseconds of EVERY load, and acting on that null would read the shared
  // row over a signed-in device's own data.
  const [authReady, setAuthReady] = useState(false)
  // Whether a shared row was actually found. Viewer mode hangs off THIS, not
  // merely off "no session": without it, every device that is not signed in
  // would go read-only the moment this shipped - including one being used
  // purely locally, and including every install made before the database
  // policy exists. No shared row, nothing changes.
  const [sharedSeen, setSharedSeen] = useState(false)

  // The server timestamp we last observed, and the local updatedAt we last
  // pushed. Both survive a reload so a restart cannot resurrect a stale write.
  const remoteAt = useRef(read(LS_REMOTE_AT))
  const pushedLocalAt = useRef(read(LS_PUSHED_AT))
  const timer = useRef(null)
  const busy = useRef(false)
  const dataRef = useRef(data)
  dataRef.current = data
  const applyRef = useRef(applyRemote)
  applyRef.current = applyRemote
  // Kept current so the unload handler, which cannot await anything, still has
  // a user id and a bearer token to write with.
  const authRef = useRef({ userId: null, token: null })
  // The (local edit, expected server timestamp) pair the unload write last
  // tried. It is NOT proof of success – nothing here can be awaited – it only
  // stops every tab-hide from re-uploading the whole blob for a write we
  // already dispatched, which after the first one lands would be rejected by
  // the compare-and-swap anyway.
  const unloadTried = useRef({ localAt: null, expected: null })

  const setRemoteAt = (v) => { remoteAt.current = v; write(LS_REMOTE_AT, v) }
  const setPushedAt = (v) => { pushedLocalAt.current = v; write(LS_PUSHED_AT, v) }

  // ---- connectivity ---------------------------------------------------------
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // ---- auth -----------------------------------------------------------------
  useEffect(() => {
    if (!cloudConfigured) return
    let cancel = null
    let alive = true
    getSession()
      .then((s) => {
        if (!alive) return
        authRef.current = { userId: s?.user?.id || null, token: s?.access_token || null }
        setUser(s?.user || null)
        setState(s?.user ? 'syncing' : 'signedOut')
        setAuthReady(true)
      })
      .catch(() => { if (alive) setAuthReady(true) })
    onAuthChange((u, session) => {
      if (!alive) return
      authRef.current = { userId: u?.id || null, token: session?.access_token || null }
      setUser(u)
      setState(u ? 'syncing' : 'signedOut')
      setAuthReady(true)
      if (!u) { setRemoteAt(null); setPushedAt(null); setLastSyncedAt(null) }
    }).then((fn) => { cancel = fn })
    return () => { alive = false; if (cancel) cancel() }
  }, [])

  const localAt = data?.updatedAt || null
  const hasLocalEdits = () => pushedLocalAt.current !== dataRef.current?.updatedAt

  // ---- core: reconcile local and remote --------------------------------------
  const sync = useCallback(async () => {
    // Latch BEFORE any await: the interval, the debounced push and the
    // foreground handler can all fire in the same tick, and a guard checked
    // after an await lets them all through -> duplicate pushes.
    if (!cloudConfigured || busy.current) return
    busy.current = true
    setState('syncing')
    setError(null)
    try {
      const u = await getUser()
      if (!u) { setState('signedOut'); return }
      if (typeof navigator !== 'undefined' && !navigator.onLine) { setState('offline'); return }

      // Two attempts: the compare-and-swap below refuses to overwrite a row
      // that moved between our read and our write, and the answer to that is
      // simply to read again and merge again – not to force our copy through.
      let carried = null // what a lost attempt already merged, kept for the retry
      let done = false

      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        const remote = await pull(u)

        // Read the store AFTER the pull, never before. A pull takes a moment on
        // mobile, and an edit made during it would otherwise be left out of the
        // merge and then wiped out by applying that merge over it.
        const localNow = dataRef.current
        const mine = carried ? mergeBlobs(localNow, carried) : localNow
        const fMine = stable(mine)

        if (!remote) {
          // No row yet – create it. If another device created it first this
          // returns null and the retry takes the normal merge path.
          const at = await createRow(mine, u)
          if (at === null) { carried = mine; continue }
          setRemoteAt(at)
          setPushedAt(mine?.updatedAt || null)
          done = true
          break
        }

        const merged = mergeBlobs(mine, remote.blob)
        const fMerged = stable(merged)
        if (fMerged !== fMine) applyRef.current(merged)

        if (fMerged === stable(remote.blob)) {
          // The server already holds everything we know.
          setRemoteAt(remote.remoteAt)
          setPushedAt(merged?.updatedAt || null)
          done = true
          break
        }

        const at = await pushCas(merged, u, remote.remoteAt)
        if (at === null) {
          // Someone wrote while we were merging. Carry what we have into the
          // next round so their write and ours both survive.
          carried = merged
          continue
        }
        setRemoteAt(at)
        setPushedAt(merged?.updatedAt || null)
        done = true
      }

      if (!done) {
        // Every attempt lost the race, so nothing reached the server. Saying
        // "in sync" here would be a lie the user cannot see through.
        setError('sync_errBusy')
        setState('error')
        return
      }
      setLastSyncedAt(new Date().toISOString())
      setState('synced')
    } catch (e) {
      setError(e?.message || String(e))
      setState('error')
    } finally {
      busy.current = false
    }
  }, [])

  // ---- debounced push after local edits --------------------------------------
  useEffect(() => {
    if (!cloudConfigured || !user || !online) return
    if (!hasLocalEdits()) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => sync(), PUSH_DEBOUNCE)
    return () => timer.current && clearTimeout(timer.current)
  }, [localAt, user, online, sync])

  // ---- initial sync once signed in, and again whenever we come back online ---
  // (One effect, not two: both used to depend on `user` and fired sync() in the
  // same commit.)
  useEffect(() => {
    if (!cloudConfigured || !user) return
    if (!online) setState('offline')
    else sync()
  }, [online, user, sync])

  // ---- automatic reconcile every 2 minutes ------------------------------------
  useEffect(() => {
    if (!cloudConfigured || !user || !online) return
    const id = setInterval(() => sync(), SYNC_INTERVAL)
    return () => clearInterval(id)
  }, [user, online, sync])

  // ---- foreground again, and one last write on the way out --------------------
  // Phones and tablets freeze timers in a backgrounded tab, so the interval
  // alone would leave a stale screen after switching back – and the tab may
  // never run code again after being hidden, so that is also the moment to get
  // the last edits out.
  useEffect(() => {
    if (!cloudConfigured || !user) return
    const flush = () => {
      // A sync is mid-flight: it holds a compare-and-swap on the timestamp we
      // would use here, so writing now would invalidate it and burn its only
      // retry. That sync is already sending this data anyway.
      if (busy.current) return
      if (!hasLocalEdits()) return
      const localAt = dataRef.current?.updatedAt || null
      const expected = remoteAt.current
      if (!expected) return
      const tried = unloadTried.current
      if (tried.localAt === localAt && tried.expected === expected) return

      const { userId, token } = authRef.current
      // Conditional on the row still being where we last saw it, so this can
      // never overwrite another device's newer work (see pushOnUnload).
      //
      // Deliberately NOT marked as pushed: nothing here can be awaited, so we
      // do not know whether the write landed – and the compare-and-swap may
      // have skipped it on purpose. Claiming success would make the next sync
      // believe there is nothing left to send and strand these edits for good.
      if (pushOnUnload(dataRef.current, userId, token, expected)) {
        unloadTried.current = { localAt, expected }
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (navigator.onLine) sync()
      } else {
        flush()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [user, sync])

  // ---- viewer: not signed in, read the shared row ---------------------------
  //
  // This is the "everyone with the link sees the current state" path. It only
  // ever READS: there is no anon write policy on the table, so the database
  // refuses a write even if something here tried one.
  //
  // Deliberately its own effect rather than a branch inside sync(): that
  // function carries the compare-and-swap and the retry that protect a signed-in
  // device's writes, and none of it applies to a reader.
  useEffect(() => {
    if (!cloudConfigured || !authReady || user || !online) return
    let alive = true
    const tick = async () => {
      // Shares the busy latch with sync() so the two can never apply a blob
      // over each other while auth is changing.
      if (!alive || busy.current) return
      busy.current = true
      try {
        const shared = await pullPublic()
        if (!alive) return
        // No shared row is not an error: the policy may simply not be in place,
        // and then the app stays on its local copy exactly as before.
        if (!shared) { setSharedSeen(false); setState('signedOut'); return }
        setSharedSeen(true)
        // Only when the server actually moved. Re-applying an identical blob
        // every two minutes would re-render the whole app for nothing.
        if (shared.remoteAt !== remoteAt.current) {
          applyRef.current(shared.blob)
          setRemoteAt(shared.remoteAt)
        }
        setLastSyncedAt(new Date().toISOString())
        setState('viewing')
      } catch (e) {
        if (alive) { setError(e?.message || String(e)); setState('error') }
      } finally {
        busy.current = false
      }
    }
    tick()
    const id = setInterval(tick, SYNC_INTERVAL)
    // Phones freeze timers in a backgrounded tab, so coming back is its own
    // reason to re-read - otherwise the screen shows this morning's numbers.
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [authReady, user, online])

  // Signing in ends viewer mode immediately, without waiting for a pull.
  useEffect(() => { if (user) setSharedSeen(false) }, [user])

  const disconnect = useCallback(async () => {
    await signOut()
    setRemoteAt(null)
    setPushedAt(null)
    setLastSyncedAt(null)
    setUser(null)
    authRef.current = { userId: null, token: null }
    setState('signedOut')
  }, [])

  return {
    cloudConfigured,
    state,
    user,
    authReady,
    // Nobody signed in, but the cloud is configured: this device is a viewer of
    // the shared state and must not be able to change it. The store turns this
    // into a hard block; the UI uses it to take the write controls away.
    readOnly: cloudConfigured && authReady && !user && sharedSeen,
    error,
    online,
    lastSyncedAt,
    pendingChanges: cloudConfigured && !!user && hasLocalEdits(),
    syncNow: () => sync(),
    disconnect
  }
}
