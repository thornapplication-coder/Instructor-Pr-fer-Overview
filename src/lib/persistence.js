// Storage persistence helpers.
//
// IMPORTANT: `navigator.storage.persist()` asks the browser NOT to evict our data
// automatically (storage pressure, Safari/iOS ITP 7-day eviction). It does **not**
// protect against the user *manually* clearing "cookies & site data" — nothing
// client-side does. Only server-side (cloud) storage survives that.

export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      if (await navigator.storage.persisted()) return true
      return await navigator.storage.persist()
    }
  } catch (e) {
    /* ignore */
  }
  return false
}

export async function persistenceStatus() {
  const out = { supported: false, persisted: false, usage: null, quota: null }
  try {
    out.supported = !!(navigator.storage && navigator.storage.persist)
    if (navigator.storage && navigator.storage.persisted) {
      out.persisted = await navigator.storage.persisted()
    }
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate()
      out.usage = e.usage
      out.quota = e.quota
    }
  } catch (e) {
    /* ignore */
  }
  return out
}
