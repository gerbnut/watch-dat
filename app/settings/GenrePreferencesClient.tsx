'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 14, name: 'Fantasy' },
  { id: 99, name: 'Documentary' },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 9648, name: 'Mystery' },
] as const

export function GenrePreferencesClient() {
  const [selected, setSelected] = useState<number[]>([])
  const [initial, setInitial] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/me/genre-preferences')
      .then((r) => r.json())
      .then((data) => {
        const ids = data.genreIds ?? []
        setSelected(ids)
        setInitial(ids)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...initial].sort())

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/me/genre-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genreIds: selected }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setInitial(selected)
      toast({ title: 'Genre preferences updated!', variant: 'success' })
    } catch {
      toast({ title: 'Failed to save preferences', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-card/80 border border-white/[0.04] p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Genre Preferences</h2>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Pick genres you love — used to personalise your For You recommendations
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const isSelected = selected.includes(genre.id)
              return (
                <button
                  key={genre.id}
                  onClick={() => toggle(genre.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all touch-manipulation active:scale-95',
                    isSelected
                      ? 'bg-cinema-500/20 text-cinema-300 ring-1 ring-cinema-500/40'
                      : 'bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06] hover:bg-white/[0.08]'
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {genre.name}
                </button>
              )
            })}
          </div>

          {hasChanges && (
            <div className="flex justify-end">
              <Button variant="cinema" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
