'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Tabs } from '@/components/ui/tabs'

const VALID_TABS = ['ranked', 'activity', 'reviews', 'diary', 'lists', 'watchlist']

export function ProfileTabs({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'ranked'
  const [activeTab, setActiveTab] = useState(initialTab)

  // React to URL changes (e.g. clicking the watchlist stat box)
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {children}
    </Tabs>
  )
}
