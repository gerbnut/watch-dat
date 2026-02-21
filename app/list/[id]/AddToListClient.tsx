'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { Plus, Loader2 } from 'lucide-react'
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

      <Dialog open={open} onOpenChange={setOpen}>
        {/* On mobile, anchor to top so the search dropdown stays above the keyboard */}
        <DialogContent className="top-[8%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle>Add a film to this list</DialogTitle>
          </DialogHeader>
          <MovieSearch
            onSelect={(movie) => { handleSelect(movie); setOpen(false) }}
            navigateOnSelect={false}
            placeholder="Search for a film..."
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
