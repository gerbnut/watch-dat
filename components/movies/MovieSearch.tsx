'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Film, Loader2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
}

interface MovieSearchProps {
  onSelect?: (movie: SearchResult) => void
  placeholder?: string
  navigateOnSelect?: boolean
  className?: string
}

export function MovieSearch({ onSelect, placeholder = 'Search films...', navigateOnSelect = true, className }: MovieSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
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
      return
    }
    setLoading(true)
    fetch(`/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results?.slice(0, 8) ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [debouncedQuery])

  // Auto-focus mobile input when overlay opens
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50)
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

  function handleSelect(movie: SearchResult) {
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
    if (onSelect) {
      onSelect(movie)
    } else if (navigateOnSelect) {
      router.push(`/film/${movie.id}`)
    }
  }

  function closeMobile() {
    setMobileOpen(false)
    setQuery('')
    setResults([])
  }

  const ResultsList = ({ onItemClick }: { onItemClick: (m: SearchResult) => void }) => (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : results.length > 0 ? (
        <ul>
          {results.map((movie) => (
            <li key={movie.id}>
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent active:bg-accent transition-colors"
                onMouseDown={() => onItemClick(movie)}
                onClick={() => onItemClick(movie)}
              >
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                  {movie.poster_path ? (
                    <Image
                      src={TMDB_IMAGE.poster(movie.poster_path, 'w185')!}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
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
      ) : query.trim().length > 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">No results for "{query}"</p>
      ) : null}
    </>
  )

  return (
    <>
      {/* ── Mobile full-screen overlay ──────────────────────────────────── */}
      {/* Uses 100dvh so it shrinks when the keyboard appears, keeping results visible */}
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
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setResults([]) }}
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
            <ResultsList onItemClick={handleSelect} />
          </div>
        </div>
      )}

      {/* ── Desktop / fallback input ─────────────────────────────────────── */}
      <div className={cn('relative', className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            // On mobile: intercept pointer-down to open the overlay *before* the keyboard appears
            onPointerDown={(e) => {
              if (window.innerWidth < 640) {
                e.preventDefault()
                setMobileOpen(true)
              }
            }}
            onFocus={() => {
              if (window.innerWidth >= 640) setOpen(true)
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="pl-9 pr-9 bg-muted/50 border-muted focus:bg-background"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop dropdown */}
        {open && query.trim().length > 0 && (
          <div className="hidden sm:block absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
            <ResultsList onItemClick={handleSelect} />
          </div>
        )}
      </div>
    </>
  )
}
