import { createContext } from 'react'

// Rasterizing a tab that is rendered off-screen at desktop width, so an export
// made from a phone looks like the desktop app. Two shapes, one mechanism:
//
//   tabImage(tabId) -> one canvas of the whole tab   (the dashboard PDF)
//   tabCards(tabId) -> one canvas PER card, in order (the PowerPoint export)
//
// Both return null / [] when unavailable or when the capture failed.
export const CaptureContext = createContext(null)
