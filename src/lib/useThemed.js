import { useStore } from './store.jsx'
import { themed } from './palette.js'

/**
 * Resolve a stored colour for the active theme.
 *
 * Category colours are persisted as plain hex (the user can pick their own), so
 * they cannot re-step themselves when the theme flips. This maps any value from
 * the documented palette to its dark-mode step and leaves custom picks alone.
 */
export function useThemed() {
  const { data } = useStore()
  const dark = (data?.theme || 'light') === 'dark'
  return (hex) => themed(hex, dark)
}
