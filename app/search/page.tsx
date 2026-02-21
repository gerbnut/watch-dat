'use client'

import React, { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, Film, Users, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MovieCard } from '@/components/movies/MovieCard'
import { useDebounce } from '@/hooks/use-debounce'
import { cn, getInitials } from '@/lib/utils'
import Link from 'next/link'

type Tab = 'films' | 'people'

function SearchContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [tab, setTab] = useState<Tab>('films')
  const [films, setFilms] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilms([])
      setPeople([])
      return
    }

    setLoading(true)
    Promise.allSettled([
      fetch(`/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
      fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
    ]).then(([movieResult, userResult]) => {
      if (movieResult.status === 'fulfilled') setFilms(movieResult.value.results ?? [])
      if (userResult.status === 'fulfilled') setPeople(Array.isArray(userResult.value) ? userResult.value : [])
      setLoading(false)
    })
  }, [debouncedQuery])

  const toggleFollow = useCallback(async (username: string, userId: string) => {
    // Optimistic update
    setPeople((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p))
    )
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
    } catch {
      // Revert on error
      setPeople((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p))
      )
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, people..."
            className="pl-10 h-11 text-base bg-muted/50"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex gap-1">
          {(['films', 'people'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === t ? 'bg-cinema-500 text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {t === 'films' ? <Film className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!debouncedQuery.trim() ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Start typing to search</p>
        </div>
      ) : tab === 'films' ? (
        films.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {films.map((movie) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.id}
                title={movie.title}
                poster={movie.poster_path}
                releaseDate={movie.release_date}
                size="sm"
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No films found for "{debouncedQuery}"</p>
        )
      ) : (
        people.length > 0 ? (
          <div className="space-y-2">
            {people.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <Link href={`/user/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.avatar ?? undefined} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:block text-xs text-muted-foreground">
                    {user._count.followers} followers
                  </span>
                  {session?.user && session.user.id !== user.id && (
                    <Button
                      variant={user.isFollowing ? 'outline' : 'cinema'}
                      size="sm"
                      onClick={() => toggleFollow(user.username, user.id)}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No people found for "{debouncedQuery}"</p>
        )
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  )
}
