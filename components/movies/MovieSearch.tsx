'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Film, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { cn, getYearFromDate } from '@/lib/utils'
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
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
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

  function handleSelect(movie: SearchResult) {
    setQuery('')
    setOpen(false)
    if (onSelect) {
      onSelect(movie)
    } else if (navigateOnSelect) {
      router.push(`/film/${movie.id}`)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
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

      {open && (query.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((movie) => (
                <li key={movie.id}>
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                    onMouseDown={() => handleSelect(movie)}
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
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No results for "{query}"</p>
          )}
        </div>
      )}
    </div>
  )
}
