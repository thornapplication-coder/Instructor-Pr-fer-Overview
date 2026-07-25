import { useCallback, useEffect, useRef, useState } from 'react'
import { cloudConfigured, getUser, onAuthChange, pull, push, signOut } from './supabaseSync.js'

// Sync engine on top of the offline-first store.
//
// Model: one jsonb blob per user, last-write-wins — but NOT blindly. We remember
// the server timestamp we last saw (`remoteAt`). If the row moved on since then
// AND we have local edits that were never pushed, that is a genuine conflict:
// we stop and let the user pick a side instead of silently discarding a device's
// work. (The same class of bug the cross-tab audit turned up locally.)
//
// state: 'off' | 'signedOut' | 'offline' | 'syncing' | 'synced' | 'error' | 'conflict'

const PUSH_DEBOUNCE = 2000
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

  // ---- core: reconcile local and remote --------------------------------------
  // `force` = 'local' keeps our copy, 'remote' takes the cloud copy.
  const sync = useCallback(
    async (force) => {
      // Latch BEFORE any await: two effects can call sync() in the same commit,
      // and a guard checked before an await lets both through -> double push,
      // which then looks like a conflict with ourselves on the next sync.
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

        if (force === 'remote' && remote) {
          applyRef.current(remote.blob)
          setRemoteAt(remote.remoteAt)
          setPushedAt(remote.blob?.updatedAt || null)
        } else if (force === 'local' || !remote) {
          const at = await push(local, u)
          setRemoteAt(at)
          setPushedAt(local?.updatedAt || null)
        } else {
          const movedOnServer = remote.remoteAt !== remoteAt.current
          if (movedOnServer && localDirty) {
            // Both sides changed since we last agreed – ask, do not guess.
            setState('conflict')
            return
          }
          if (movedOnServer) {
            applyRef.current(remote.blob)
            setRemoteAt(remote.remoteAt)
            setPushedAt(remote.blob?.updatedAt || null)
          } else if (localDirty) {
            const at = await push(local, u)
            setRemoteAt(at)
            setPushedAt(local?.updatedAt || null)
          }
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

  const disconnect = useCallback(async () => {
    await signOut()
    setRemoteAt(null)
    setPushedAt(null)
    setLastSyncedAt(null)
    setUser(null)
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
    keepLocal: () => sync('local'),
    takeRemote: () => sync('remote'),
    disconnect
  }
}
