'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, Users, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getInitials } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface UserResult {
  id: string
  username: string
  displayName: string
  avatar: string | null
  bio?: string | null
  isFollowing: boolean
  _count: { reviews: number; followers: number }
}

function FollowToggle({
  user,
  onToggle,
}: {
  user: UserResult
  onToggle: (username: string, nowFollowing: boolean) => void
}) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.username}/follow`, { method: 'POST' })
      const data = await res.json()
      onToggle(user.username, data.following)
    } catch {
      toast({ title: 'Error', description: 'Failed to update follow', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={user.isFollowing ? 'outline' : 'cinema'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="shrink-0 gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : user.isFollowing ? (
        <><UserMinus className="h-4 w-4 mr-1" />Unfollow</>
      ) : (
        <><UserPlus className="h-4 w-4 mr-1" />Follow</>
      )}
    </Button>
  )
}

function UserRow({
  user,
  currentUserId,
  onToggle,
}: {
  user: UserResult
  currentUserId: string
  onToggle: (username: string, nowFollowing: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors">
      <Link href={`/user/${user.username}`} className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback className="text-sm bg-cinema-900 text-cinema-300">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{user.displayName}</p>
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
          )}
        </div>
      </Link>
      {user.id !== currentUserId && (
        <FollowToggle user={user} onToggle={onToggle} />
      )}
    </div>
  )
}

export default function FriendsPage() {
  const { data: session, status } = useSession()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [following, setFollowing] = useState<UserResult[]>([])
  const [loadingFollowing, setLoadingFollowing] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFollowing()
    }
  }, [status])

  async function fetchFollowing() {
    setLoadingFollowing(true)
    try {
      const res = await fetch('/api/friends')
      if (res.ok) {
        const data = await res.json()
        setFollowing(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoadingFollowing(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleToggle(username: string, nowFollowing: boolean) {
    setSearchResults((prev) =>
      prev.map((u) => (u.username === username ? { ...u, isFollowing: nowFollowing } : u))
    )
    if (!nowFollowing) {
      setFollowing((prev) => prev.filter((u) => u.username !== username))
    } else {
      // Re-fetch to pick up the newly followed user with full data
      fetchFollowing()
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">
          Please{' '}
          <Link href="/login" className="underline hover:text-foreground">
            sign in
          </Link>{' '}
          to view friends.
        </p>
      </div>
    )
  }

  const showSearchResults = query.trim().length > 0

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Friends</h1>
        <p className="text-sm text-muted-foreground mt-1">Find and follow other members</p>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username…"
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {showSearchResults && (
          <div className="rounded-lg border bg-card overflow-hidden">
            {searchResults.length === 0 && !searching ? (
              <p className="text-sm text-muted-foreground text-center py-6">No users found.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {searchResults.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={session.user.id}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Following list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Following</h2>
          {!loadingFollowing && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {following.length}
            </span>
          )}
        </div>

        {loadingFollowing ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : following.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">You&apos;re not following anyone yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Search above to find people to follow.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border/50">
            {following.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={session.user.id}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
