'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityFeedItem } from './ActivityFeedItem'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Tab = 'following' | 'for-you'

interface FeedItem {
  id: string
  [key: string]: any
}

interface TabState {
  items: FeedItem[]
  nextCursor: string | null
  nextSkip: number | null
  loading: boolean
  loaded: boolean
  hasMore: boolean
}

const EMPTY_TAB: TabState = {
  items: [],
  nextCursor: null,
  nextSkip: null,
  loading: false,
  loaded: false,
  hasMore: true,
}

interface FeedTabsProps {
  currentUserId: string
  initialItems?: FeedItem[]
  initialNextCursor?: string | null
}

export function FeedTabs({ currentUserId, initialItems, initialNextCursor }: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('following')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const [followingState, setFollowingState] = useState<TabState>({
    ...EMPTY_TAB,
    items: initialItems ?? [],
    nextCursor: initialNextCursor ?? null,
    loaded: !!initialItems,
    hasMore: initialNextCursor !== null && initialNextCursor !== undefined
      ? true
      : !!initialItems && initialItems.length >= 20,
  })
  const [forYouState, setForYouState] = useState<TabState>(EMPTY_TAB)

  const loadFollowing = useCallback(async (cursor: string | null) => {
    setFollowingState((s) => ({ ...s, loading: true }))
    try {
      const url = cursor
        ? `/api/feed/following?cursor=${encodeURIComponent(cursor)}`
        : '/api/feed/following'
      const res = await fetch(url)
      const data = await res.json()
      const newItems: FeedItem[] = data.activities ?? []
      setFollowingState((s) => ({
        ...s,
        items: cursor ? [...s.items, ...newItems] : newItems,
        nextCursor: data.nextCursor ?? null,
        loaded: true,
        hasMore: !!data.nextCursor,
        loading: false,
      }))
    } catch {
      setFollowingState((s) => ({ ...s, loading: false }))
    }
  }, [])

  const loadForYou = useCallback(async (skip: number) => {
    setForYouState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch(`/api/feed/for-you?skip=${skip}`)
      const data = await res.json()
      const newItems: FeedItem[] = data.activities ?? []
      setForYouState((s) => ({
        ...s,
        items: skip === 0 ? newItems : [...s.items, ...newItems],
        nextSkip: data.nextSkip ?? null,
        loaded: true,
        hasMore: data.nextSkip !== null,
        loading: false,
      }))
    } catch {
      setForYouState((s) => ({ ...s, loading: false }))
    }
  }, [])

  // Load initial following feed if no server-provided items
  useEffect(() => {
    if (!followingState.loaded) {
      loadFollowing(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load for-you feed when tab is first opened
  useEffect(() => {
    if (activeTab === 'for-you' && !forYouState.loaded) {
      loadForYou(0)
    }
  }, [activeTab, forYouState.loaded, loadForYou])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (activeTab === 'following') {
          if (followingState.hasMore && !followingState.loading && followingState.loaded) {
            loadFollowing(followingState.nextCursor)
          }
        } else {
          if (forYouState.hasMore && !forYouState.loading && forYouState.loaded) {
            loadForYou(forYouState.nextSkip ?? 0)
          }
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [
    activeTab,
    followingState.hasMore,
    followingState.loading,
    followingState.loaded,
    followingState.nextCursor,
    forYouState.hasMore,
    forYouState.loading,
    forYouState.loaded,
    forYouState.nextSkip,
    loadFollowing,
    loadForYou,
  ])

  const currentState = activeTab === 'following' ? followingState : forYouState
  const currentItems = currentState.items

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border mb-4">
        {(['following', 'for-you'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors relative',
              activeTab === tab
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab === 'following' ? 'Following' : 'For You'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cinema-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Feed content */}
      {currentState.loading && currentItems.length === 0 ? (
        <div className="rounded-xl border bg-card divide-y divide-border/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4">
              <div className="skeleton h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-2/5 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="flex gap-2 mt-1">
                  <div className="skeleton h-16 w-11 rounded" />
                  <div className="skeleton h-16 w-11 rounded" />
                  <div className="skeleton h-16 w-11 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 && currentState.loaded ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-4">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <div>
            {activeTab === 'following' ? (
              <>
                <p className="font-medium">Your feed is empty</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Follow other cinephiles to see their activity here
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Nothing here yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Popular reviews from the community will appear here
                </p>
              </>
            )}
          </div>
          {activeTab === 'following' && (
            <Link href="/search">
              <Button variant="outline" size="sm">Find people to follow</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card px-4">
          {currentItems.map((activity) => (
            <ActivityFeedItem
              key={activity.id}
              activity={activity as any}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {currentState.loading && currentItems.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* End of feed */}
      {!currentState.hasMore && currentItems.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">You're all caught up</p>
      )}
    </div>
  )
}
