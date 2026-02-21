'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function LayoutTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const contentRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // --- Page-enter animation ---
    const el = contentRef.current
    if (el) {
      el.classList.remove('page-content')
      void el.offsetWidth // force reflow to restart animation
      el.classList.add('page-content')
    }

    // --- Progress bar ---
    const bar = barRef.current
    if (!bar) return

    // Reset
    bar.style.transition = 'none'
    bar.style.width = '0%'
    bar.style.opacity = '1'
    void bar.offsetWidth // force reflow

    // Sprint to 80%
    bar.style.transition = 'width 0.25s ease-out'
    bar.style.width = '80%'

    // After the page renders, complete + fade
    const completeTimer = setTimeout(() => {
      bar.style.transition = 'width 0.15s ease-in'
      bar.style.width = '100%'

      const fadeTimer = setTimeout(() => {
        bar.style.transition = 'opacity 0.25s ease-out'
        bar.style.opacity = '0'
      }, 150)

      return () => clearTimeout(fadeTimer)
    }, 250)

    return () => clearTimeout(completeTimer)
  }, [pathname])

  return (
    <>
      {/* Cinema-green top progress bar */}
      <div ref={barRef} className="nav-progress" aria-hidden="true" />
      <div ref={contentRef} className="page-content">
        {children}
      </div>
    </>
  )
}
