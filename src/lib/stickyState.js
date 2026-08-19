import { useCallback, useState } from 'react'

/**
 * A filter that survives leaving the tab.
 *
 * Search boxes and filter dropdowns were plain component state, so switching
 * to the dashboard and back emptied every one of them. On a list of fifty
 * people spanning fourteen screens that is not a small tax: any cross-reference
 * between two tabs meant typing the search again.
 *
 * `sessionStorage`, deliberately, and not the store:
 *  - the store is synced, and "what I am currently filtering by" is not a fact
 *    about the roster - it must not travel to another device;
 *  - localStorage would outlive the browser session, so a filter set weeks ago
 *    would still be narrowing the list on a Monday morning with no memory of
 *    why;
 *  - sessionStorage is per tab and dies with it, which is the same lifetime the
 *    question has.
 *
 * The in-memory Map is the fallback for a browser that refuses storage
 * (private mode, a locked-down device); there the value still survives a tab
 * switch, just not a reload.
 *
 * NOTE for anyone adding one: a filter that persists MUST be visible. See the
 * FilterNote next to the row counters - a list that silently opens filtered is
 * worse than one that forgets.
 */
const NS = 'ewl737:ui:'
const mem = new Map()

function read(key, initial) {
  if (mem.has(key)) return mem.get(key)
  try {
    const raw = sessionStorage.getItem(NS + key)
    if (raw != null) return JSON.parse(raw)
  } catch (_) { /* storage refused - the Map still works */ }
  return initial
}

function write(key, value) {
  mem.set(key, value)
  try {
    sessionStorage.setItem(NS + key, JSON.stringify(value))
  } catch (_) { /* nothing to do; the Map already holds it */ }
}

export function useSticky(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))
  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? next(prev) : next
        write(key, v)
        return v
      })
    },
    [key]
  )
  return [value, set]
}

/** Forget every filter of one tab (its keys all share the prefix). */
export function clearSticky(prefix) {
  for (const k of [...mem.keys()]) if (k.startsWith(prefix)) mem.delete(k)
  try {
    for (const k of Object.keys(sessionStorage)) {
      if (k.startsWith(NS + prefix)) sessionStorage.removeItem(k)
    }
  } catch (_) { /* nothing stored, nothing to clear */ }
}
