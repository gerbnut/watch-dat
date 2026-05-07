'use client'

import React, { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, Film, Users, Clapperboard, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MovieCard } from '@/components/movies/MovieCard'
import { useDebounce } from '@/hooks/use-debounce'
import { cn, getInitials } from '@/lib/utils'
import { TMDB_IMAGE } from '@/lib/tmdb'
import Link from 'next/link'

type Tab = 'films' | 'members' | 'cast'

function SearchContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [tab, setTab] = useState<Tab>('films')
  const [films, setFilms] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [cast, setCast] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilms([])
      setMembers([])
      setCast([])
      return
    }

    setLoading(true)
    Promise.allSettled([
      fetch(`/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
      fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
      fetch(`/api/people/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
    ]).then(([movieResult, userResult, castResult]) => {
      if (movieResult.status === 'fulfilled') setFilms(movieResult.value.results ?? [])
      else console.warn('Film search failed:', movieResult.reason)
      if (userResult.status === 'fulfilled') setMembers(Array.isArray(userResult.value) ? userResult.value : [])
      else console.warn('User search failed:', userResult.reason)
      if (castResult.status === 'fulfilled') setCast(castResult.value.results ?? [])
      else console.warn('Cast search failed:', castResult.reason)
      setLoading(false)
    })
  }, [debouncedQuery])

  const toggleFollow = useCallback(async (username: string, userId: string) => {
    setMembers((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p))
    )
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
    } catch {
      setMembers((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p))
      )
    }
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'films', label: 'Films', icon: Film },
    { id: 'cast', label: 'Cast & Crew', icon: Clapperboard },
    { id: 'members', label: 'Members', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, cast & crew, members..."
            className="pl-10 h-11 text-base bg-white/[0.03] border-white/[0.04]"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
                tab === id ? 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-transparent'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {!debouncedQuery.trim() ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Start typing to search</p>
        </div>
      ) : loading ? (
        tab === 'films' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton aspect-[2/3] w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : tab === 'cast' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3">
                <div className="skeleton h-20 w-20 rounded-full" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-card/80 p-4">
                <div className="skeleton h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        )
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
          <p className="text-center text-muted-foreground py-8">No films found for &quot;{debouncedQuery}&quot;</p>
        )
      ) : tab === 'cast' ? (
        cast.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cast.map((person: any) => (
              <Link
                key={person.id}
                href={`/person/${person.id}`}
                className="group flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted shrink-0">
                  {person.profile_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={TMDB_IMAGE.profile(person.profile_path, 'w185')!}
                      alt={person.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-2xl font-bold">
                      {person.name[0]}
                    </div>
                  )}
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-sm font-medium truncate group-hover:text-foreground">{person.name}</p>
                  {person.known_for_department && (
                    <p className="text-xs text-muted-foreground">{person.known_for_department}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No cast or crew found for &quot;{debouncedQuery}&quot;</p>
        )
      ) : (
        members.length > 0 ? (
          <div className="space-y-2">
            {members.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-card/80 p-4">
                <Link href={`/user/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/[0.06]">
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
          <p className="text-center text-muted-foreground py-8">No members found for &quot;{debouncedQuery}&quot;</p>
        )
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="skeleton h-7 w-20 rounded" />
            <div className="skeleton h-11 w-full rounded-lg" />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
