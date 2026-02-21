'use client'

console.log('>>> AddToListClient PATCHED v2')

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { Plus, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AddToListClientProps {
  listId: string
}

export function AddToListClient({ listId }: AddToListClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSelect(movie: any) {
    setLoading(true)
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: movie.id }),
      })
      if (!res.ok) throw new Error('Failed to add')
      toast({ title: `${movie.title} added to list`, variant: 'success' as any })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Failed to add film', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add film
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/*
            Panel: on mobile — full-width, pinned to top-0 so it's always
            above the keyboard. On sm+ — centered modal (max-w-lg, rounded).
          */}
          <div className="absolute inset-x-0 top-0 z-10 bg-background border-b sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold">Add a film to this list</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <MovieSearch
                onSelect={(movie) => { handleSelect(movie); setOpen(false) }}
                navigateOnSelect={false}
                placeholder="Search for a film..."
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
