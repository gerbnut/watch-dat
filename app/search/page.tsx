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
import Image from 'next/image'

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
      if (userResult.status === 'fulfilled') setMembers(Array.isArray(userResult.value) ? userResult.value : [])
      if (castResult.status === 'fulfilled') setCast(castResult.value.results ?? [])
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
            className="pl-10 h-11 text-base bg-muted/50"
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
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === id ? 'bg-cinema-500 text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
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
      ) : tab === 'cast' ? (
        cast.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cast.map((person: any) => (
              <Link
                key={person.id}
                href={`/person/${person.id}`}
                className="group flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted shrink-0">
                  {person.profile_path ? (
                    <Image
                      src={TMDB_IMAGE.profile(person.profile_path, 'w185')!}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="80px"
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
          <p className="text-center text-muted-foreground py-8">No cast or crew found for "{debouncedQuery}"</p>
        )
      ) : (
        members.length > 0 ? (
          <div className="space-y-2">
            {members.map((user: any) => (
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
          <p className="text-center text-muted-foreground py-8">No members found for "{debouncedQuery}"</p>
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
