'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Tabs } from '@/components/ui/tabs'

const VALID_TABS = ['ranked', 'activity', 'reviews', 'diary', 'lists', 'watchlist']

export function ProfileTabs({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'ranked'
  const [activeTab, setActiveTab] = useState(initialTab)
  const tabsRef = useRef<HTMLDivElement>(null)

  // React to URL changes (e.g. clicking the watchlist stat box)
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
      // Small delay to let the tab render before scrolling
      setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [tabParam])

  return (
    <div ref={tabsRef}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {children}
      </Tabs>
    </div>
  )
}
