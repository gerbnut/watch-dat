'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Loader2, ArrowLeft, User } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface SearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
}

interface UserResult {
  id: string
  username: string
  displayName: string
  avatar: string | null
}

interface MovieSearchProps {
  onSelect?: (movie: SearchResult) => void
  placeholder?: string
  navigateOnSelect?: boolean
  showPeople?: boolean
  className?: string
  /** When true, disables the mobile full-screen overlay (use inside modals/dialogs
   *  to avoid being trapped by the dialog's CSS transform stacking context). */
  inModal?: boolean
}

export function MovieSearch({
  onSelect,
  placeholder = 'Search films...',
  navigateOnSelect = true,
  showPeople = false,
  className,
  inModal = false,
}: MovieSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [people, setPeople] = useState<UserResult[]>([])
  const [tmdbPeople, setTmdbPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setPeople([])
      setTmdbPeople([])
      return
    }
    const controller = new AbortController()
    setLoading(true)
    const fetches: Promise<any>[] = [
      fetch(`/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }).then((r) => r.json()),
    ]
    if (showPeople) {
      fetches.push(
        fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }).then((r) => r.json()),
        fetch(`/api/people/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }).then((r) => r.json()),
      )
    }
    Promise.allSettled(fetches).then(([movieRes, userRes, castRes]) => {
      if (controller.signal.aborted) return
      if (movieRes.status === 'fulfilled') setResults(movieRes.value.results?.slice(0, 5) ?? [])
      if (userRes?.status === 'fulfilled') setPeople(Array.isArray(userRes.value) ? userRes.value.slice(0, 4) : [])
      if (castRes?.status === 'fulfilled') setTmdbPeople(castRes.value.results?.slice(0, 3) ?? [])
      setLoading(false)
    })
    return () => controller.abort()
  }, [debouncedQuery, showPeople])

  // Auto-focus mobile input when overlay opens
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 0)
    }
  }, [mobileOpen])

  // Prevent body scroll while mobile overlay is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function handleSelectFilm(movie: SearchResult) {
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
    if (onSelect) {
      onSelect(movie)
    } else if (navigateOnSelect) {
      router.push(`/film/${movie.id}`)
    }
  }

  function handleSelectUser(user: UserResult) {
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
    router.push(`/user/${user.username}`)
  }

  function closeMobile() {
    setMobileOpen(false)
    setQuery('')
    setResults([])
    setPeople([])
    setTmdbPeople([])
  }

  function handleSelectPerson(personId: number) {
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
    router.push(`/person/${personId}`)
  }

  const hasResults = results.length > 0 || people.length > 0 || tmdbPeople.length > 0

  const ResultsList = ({ onFilmClick, onUserClick }: { onFilmClick: (m: SearchResult) => void; onUserClick: (u: UserResult) => void }) => (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : hasResults ? (
        <div>
          {results.length > 0 && (
            <>
              {showPeople && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Films
                </p>
              )}
              <ul>
                {results.map((movie) => (
                  <li key={movie.id}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] rounded-lg transition-colors"
                      onMouseDown={() => onFilmClick(movie)}
                      onClick={() => onFilmClick(movie)}
                    >
                      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-white/[0.06] bg-muted">
                        <MoviePoster
                          poster={movie.poster_path}
                          title={movie.title}
                          tmdbSize="w92"
                          sizes="32px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{movie.title}</p>
                        {movie.release_date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {showPeople && tmdbPeople.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-white/[0.04]">
                Cast & Crew
              </p>
              <ul>
                {tmdbPeople.map((person: any) => (
                  <li key={person.id}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] rounded-lg transition-colors"
                      onMouseDown={() => handleSelectPerson(person.id)}
                      onClick={() => handleSelectPerson(person.id)}
                    >
                      <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-muted">
                        {person.profile_path ? (
                          <Image
                            src={TMDB_IMAGE.profile(person.profile_path, 'w45')!}
                            alt={person.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-xs font-bold">
                            {person.name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{person.name}</p>
                        {person.known_for_department && (
                          <p className="text-xs text-muted-foreground">{person.known_for_department}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {showPeople && people.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-white/[0.04]">
                Members
              </p>
              <ul>
                {people.map((user) => (
                  <li key={user.id}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] rounded-lg transition-colors"
                      onMouseDown={() => onUserClick(user)}
                      onClick={() => onUserClick(user)}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : query.trim().length > 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground/60">No results for "{query}"</p>
      ) : null}
    </>
  )

  return (
    <>
      {/* ── Mobile full-screen overlay ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-x-0 top-0 z-[200] flex flex-col bg-background"
          style={{ height: '100dvh' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
            <button
              onClick={closeMobile}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Close search"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={mobileInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9 bg-muted/50"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setResults([]); setPeople([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results — fills remaining space above keyboard */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <ResultsList onFilmClick={handleSelectFilm} onUserClick={handleSelectUser} />
          </div>
        </div>
      )}

      {/* ── Desktop / fallback input (also used for inModal on all screen sizes) ── */}
      <div className={cn('relative', className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onPointerDown={(e) => {
              if (!inModal && window.innerWidth < 640) {
                e.preventDefault()
                setMobileOpen(true)
              }
            }}
            onFocus={() => {
              if (inModal || window.innerWidth >= 640) setOpen(true)
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="pl-9 pr-9 bg-white/[0.03] border-white/[0.04] focus:bg-white/[0.05]"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setPeople([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Inline results — used on desktop always, and on mobile when inModal=true */}
        {open && query.trim().length > 0 && (
          <div className={cn(
            'z-50 mt-1 rounded-xl backdrop-blur-xl bg-[hsl(225_14%_7%_/_0.95)] border border-white/[0.06] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden p-1',
            'overflow-y-auto overscroll-contain',
            inModal
              ? 'relative max-h-none'
              : 'absolute top-full left-0 right-0 max-h-[50vh] hidden sm:block',
          )}>
            <ResultsList onFilmClick={handleSelectFilm} onUserClick={handleSelectUser} />
          </div>
        )}
      </div>
    </>
  )
}
