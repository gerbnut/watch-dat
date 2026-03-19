'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn, getInitials } from '@/lib/utils'
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
  const [isFollowing, setIsFollowing] = useState(user.isFollowing)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsFollowing(user.isFollowing)
  }, [user.isFollowing])

  async function toggle() {
    const next = !isFollowing
    setIsFollowing(next)
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.username}/follow`, { method: 'POST' })
      const data = await res.json()
      setIsFollowing(data.following)
      onToggle(user.username, data.following)
    } catch {
      setIsFollowing(!next)
      toast({ title: 'Error', description: 'Failed to update follow', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'relative shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
        isFollowing
          ? 'border border-border bg-muted text-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive'
          : 'bg-cinema-500 text-black hover:bg-cinema-400'
      )}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

export function FriendSearch() {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleToggle(username: string, nowFollowing: boolean) {
    setResults((prev) =>
      prev.map((u) => (u.username === username ? { ...u, isFollowing: nowFollowing } : u))
    )
  }

  if (!session?.user) return null

  const showResults = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Find friends..."
          className="pl-9 h-9 text-sm"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/[0.06] bg-[hsl(225_14%_7%_/_0.95)] backdrop-blur-xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden max-h-72 overflow-y-auto">
          {results.length === 0 && !searching ? (
            <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {results.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                  <Link
                    href={`/user/${user.username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <Avatar className="h-8 w-8 shrink-0 ring-1 ring-white/[0.06]">
                      <AvatarImage src={user.avatar ?? undefined} />
                      <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </Link>
                  {user.id !== session.user.id && (
                    <FollowToggle user={user} onToggle={handleToggle} />
                  )}
                </div>
              ))}
            </div>
          )}
          {results.length > 0 && (
            <Link
              href="/friends"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-cinema-400 hover:underline py-2.5 border-t border-white/[0.04]"
            >
              View all friends →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
