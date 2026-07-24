import { createContext } from 'react'

// Provides an async `captureTabImage(tabId)` that rasterizes a tab rendered
// off-screen at desktop width (used by the dashboard PDF export). null if
// unavailable / capture failed.
export const CaptureContext = createContext(null)
