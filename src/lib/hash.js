// The URL fragment as segments: '#/conversion/table' -> ['conversion', 'table'].
//
// The first segment names the tab (App.jsx). Anything after it belongs to
// whatever that tab renders - the conversion hub keeps its Board/Planung/
// Kalender choice there, so a glance at the dashboard and back does not throw
// the planner off the view they were working in.
export function hashParts() {
  if (typeof window === 'undefined') return []
  return String(window.location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean)
}

// Replace the fragment without adding a history entry and without firing
// `hashchange` - the tab state is already where it needs to be.
export function setHash(parts) {
  if (typeof window === 'undefined') return
  const want = '#/' + parts.filter(Boolean).join('/')
  if (window.location.hash !== want) window.history.replaceState(null, '', want)
}
