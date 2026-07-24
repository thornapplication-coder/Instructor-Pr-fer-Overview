import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Horizontally scrollable container that also shows a synced scrollbar ABOVE the
// content, so you can scroll sideways without first scrolling to the bottom.
// The inner content keeps its own (native) bottom scrollbar as well.
export default function HScroll({ className, children }) {
  const topRef = useRef(null)
  const bodyRef = useRef(null)
  const syncing = useRef(false)
  const [width, setWidth] = useState(0)

  // Keep the top spacer as wide as the body's scroll width (re-measured on every
  // render, so it tracks cards being filtered in/out; guarded to avoid loops).
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (body) setWidth((w) => (w !== body.scrollWidth ? body.scrollWidth : w))
  })

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => setWidth((w) => (w !== body.scrollWidth ? body.scrollWidth : w))
    const ro = new ResizeObserver(measure)
    ro.observe(body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const mirror = (from, to) => {
    if (syncing.current || !from || !to) return
    syncing.current = true
    to.scrollLeft = from.scrollLeft
    syncing.current = false
  }

  return (
    <div className="hscroll">
      <div className="hscroll-top" ref={topRef} onScroll={() => mirror(topRef.current, bodyRef.current)}>
        <div className="hscroll-spacer" style={{ width }} />
      </div>
      <div className={className} ref={bodyRef} onScroll={() => mirror(bodyRef.current, topRef.current)}>
        {children}
      </div>
    </div>
  )
}
