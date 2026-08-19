import React, { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function Modal({ title, onClose, children, footer, wide, xwide }) {
  const ref = useRef(null)
  const backdropRef = useRef(null)
  const lastFocused = useRef(null)
  // Callers pass a fresh arrow on every render, so keep the latest handler in a
  // ref instead of in the effect's dep list: re-running the effect per render
  // would move focus back to the first control after every keystroke that
  // writes to the store (planning notes, category labels, …).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Keep the dialog inside what is ACTUALLY visible.
  //
  // On iOS the on-screen keyboard does not shrink the layout viewport, and it
  // does not shrink `dvh` either - only `visualViewport` knows about it. A
  // dialog sized in `vh` therefore keeps its full height behind the keyboard,
  // and its footer (Save, Delete) sits under it, unreachable: typing into a
  // field near the bottom left no way to save what was typed.
  //
  // So the backdrop is told the real numbers and positions itself over them.
  // Falls back to the window when visualViewport is missing, which is exactly
  // the old behaviour.
  useEffect(() => {
    const node = backdropRef.current
    if (!node) return
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight
      const top = vv ? vv.offsetTop : 0
      node.style.setProperty('--vv-h', h + 'px')
      node.style.setProperty('--vv-top', top + 'px')
    }
    apply()
    if (!vv) return
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
    }
  }, [])

  useEffect(() => {
    lastFocused.current = document.activeElement
    const node = ref.current
    const focusables = () => (node ? Array.from(node.querySelectorAll(FOCUSABLE)) : [])
    // Move focus into the dialog so keyboard users aren't stranded behind it.
    const first = focusables()[0]
    if (first) first.focus()
    else if (node) node.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return
      // Trap Tab within the dialog.
      const list = focusables()
      if (!list.length) return
      const idx = list.indexOf(document.activeElement)
      if (e.shiftKey && idx <= 0) { e.preventDefault(); list[list.length - 1].focus() }
      else if (!e.shiftKey && idx === list.length - 1) { e.preventDefault(); list[0].focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      // Restore focus to whatever opened the dialog.
      const prev = lastFocused.current
      if (prev && typeof prev.focus === 'function') prev.focus()
    }
  }, [])

  return (
    <div className="modal-backdrop" ref={backdropRef} onMouseDown={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        className={'modal' + (xwide ? ' modal-xwide' : wide ? ' modal-wide' : '')}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
