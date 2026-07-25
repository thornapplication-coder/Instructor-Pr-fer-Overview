import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cloudConfigured,
  getSession,
  getUser,
  onAuthChange,
  pull,
  push,
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
      })
      .catch(() => {})
    onAuthChange((u, session) => {
      if (!alive) return
      authRef.current = { userId: u?.id || null, token: session?.access_token || null }
      setUser(u)
      setState(u ? 'syncing' : 'signedOut')
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

      const remote = await pull(u)
      const local = dataRef.current

      if (!remote) {
        // Nothing stored yet – our copy starts the row.
        const at = await push(local, u)
        setRemoteAt(at)
        setPushedAt(local?.updatedAt || null)
      } else {
        const merged = mergeBlobs(local, remote.blob)
        const fMerged = stable(merged)
        if (fMerged !== stable(local)) applyRef.current(merged)
        if (fMerged !== stable(remote.blob)) {
          const at = await push(merged, u)
          setRemoteAt(at)
        } else {
          setRemoteAt(remote.remoteAt)
        }
        setPushedAt(merged?.updatedAt || null)
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
      if (!hasLocalEdits()) return
      const { userId, token } = authRef.current
      if (pushOnUnload(dataRef.current, userId, token)) {
        setPushedAt(dataRef.current?.updatedAt || null)
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
    error,
    online,
    lastSyncedAt,
    pendingChanges: cloudConfigured && !!user && hasLocalEdits(),
    syncNow: () => sync(),
    disconnect
  }
}
