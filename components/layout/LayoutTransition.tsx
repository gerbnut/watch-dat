'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function LayoutTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Remove and re-add the class to restart the animation on route change
    el.classList.remove('page-content')
    void el.offsetWidth // force reflow
    el.classList.add('page-content')
  }, [pathname])

  return (
    <div ref={ref} className="page-content">
      {children}
    </div>
  )
}
