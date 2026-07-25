import { useCallback, useEffect, useRef, useState } from 'react'
import { cloudConfigured, getUser, onAuthChange, pull, push, signOut } from './supabaseSync.js'

// Sync engine on top of the offline-first store.
//
// Model: one jsonb blob per user. The cloud is the single source of truth –
// whenever the server row moved on since we last saw it, we take the cloud
// copy, no questions asked. Local edits still travel upwards: they are pushed a
// couple of seconds after the change, so the overwrite normally has nothing to
// discard.
//
// It CAN discard something though – edits made while offline, or made in the
// seconds before another device's push lands. Those are not thrown away: the
// local blob is stashed first and can be restored with one click (and that
// restore is then pushed, making it the new cloud truth). That keeps the
// "cloud always wins" rule the user asked for without turning a lost
// connection into lost work.
//
// state: 'off' | 'signedOut' | 'offline' | 'syncing' | 'synced' | 'error'

const PUSH_DEBOUNCE = 2000
const SYNC_INTERVAL = 120000 // full reconcile every 2 minutes
const LS_REMOTE_AT = 'ewl737:sync:remoteAt'
const LS_PUSHED_AT = 'ewl737:sync:pushedAt'
const LS_BACKUP = 'ewl737:sync:backup'

const read = (k) => { try { return localStorage.getItem(k) } catch (_) { return null } }
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch (_) { /* ignore */ } }

const readBackup = () => {
  try {
    const raw = read(LS_BACKUP)
    if (!raw) return null
    const b = JSON.parse(raw)
    return b && b.blob && Array.isArray(b.blob.trainers) ? b : null
  } catch (_) {
    return null
  }
}

export function useCloudSync(data, applyRemote) {
  const [state, setState] = useState(cloudConfigured ? 'signedOut' : 'off')
  const [user, setUser] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [error, setError] = useState(null)
  const [backup, setBackup] = useState(() => (cloudConfigured ? readBackup() : null))
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
    getUser().then((u) => { if (alive) { setUser(u); setState(u ? 'syncing' : 'signedOut') } }).catch(() => {})
    onAuthChange((u) => {
      if (!alive) return
      setUser(u)
      setState(u ? 'syncing' : 'signedOut')
      if (!u) { setRemoteAt(null); setPushedAt(null); setLastSyncedAt(null) }
    }).then((fn) => { cancel = fn })
    return () => { alive = false; if (cancel) cancel() }
  }, [])

  const localAt = data?.updatedAt || null
  const hasLocalEdits = () => pushedLocalAt.current !== dataRef.current?.updatedAt

  // Stash the local blob we are about to overwrite with the cloud copy.
  const stashLocal = (blob) => {
    if (!blob || !Array.isArray(blob.trainers)) return
    const entry = { at: new Date().toISOString(), blob }
    write(LS_BACKUP, JSON.stringify(entry))
    setBackup(entry)
  }

  // ---- core: reconcile local and remote --------------------------------------
  // `force` = 'local' pushes our copy over the cloud (used by the restore).
  const sync = useCallback(
    async (force) => {
      // Latch BEFORE any await: the interval, the debounced push and the
      // visibility handler can all fire in the same tick, and a guard checked
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
        const localDirty = hasLocalEdits()

        if (force === 'local' || !remote) {
          // No row yet, or an explicit restore: our copy becomes the truth.
          const at = await push(local, u)
          setRemoteAt(at)
          setPushedAt(local?.updatedAt || null)
        } else if (remote.remoteAt !== remoteAt.current) {
          // The cloud moved on -> the cloud wins, always.
          if (localDirty) stashLocal(local)
          applyRef.current(remote.blob)
          setRemoteAt(remote.remoteAt)
          setPushedAt(remote.blob?.updatedAt || null)
        } else if (localDirty) {
          const at = await push(local, u)
          setRemoteAt(at)
          setPushedAt(local?.updatedAt || null)
        }
        setLastSyncedAt(new Date().toISOString())
        setState('synced')
      } catch (e) {
        setError(e?.message || String(e))
        setState('error')
      } finally {
        busy.current = false
      }
    },
    []
  )

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

  // Phones and tablets freeze timers in a backgrounded tab, so the interval
  // alone would leave a stale screen after switching back. Reconcile on return.
  useEffect(() => {
    if (!cloudConfigured || !user) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, sync])

  const disconnect = useCallback(async () => {
    await signOut()
    setRemoteAt(null)
    setPushedAt(null)
    setLastSyncedAt(null)
    setUser(null)
    setState('signedOut')
  }, [])

  const dismissBackup = useCallback(() => {
    write(LS_BACKUP, null)
    setBackup(null)
  }, [])

  // Put the stashed local copy back and make it the new cloud truth.
  const restoreBackup = useCallback(async () => {
    const b = readBackup()
    if (!b) return
    applyRef.current(b.blob)
    write(LS_BACKUP, null)
    setBackup(null)
    // The applied blob carries an older updatedAt than what we last pushed, so
    // it counts as a local edit; force the push so it cannot lose a race with
    // the periodic reconcile.
    await sync('local')
  }, [sync])

  return {
    cloudConfigured,
    state,
    user,
    error,
    online,
    lastSyncedAt,
    backupAt: backup?.at || null,
    pendingChanges: cloudConfigured && !!user && hasLocalEdits(),
    syncNow: () => sync(),
    restoreBackup,
    dismissBackup,
    disconnect
  }
}
