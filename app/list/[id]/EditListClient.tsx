'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface EditListClientProps {
  listId: string
  items: { id: string; movieTitle: string }[]
}

export function EditListClient({ listId, items }: EditListClientProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  async function removeItem(itemId: string, title: string) {
    setRemoving(itemId)
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Removed ${title}` })
      router.refresh()
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' })
    } finally {
      setRemoving(null)
    }
  }

  if (!editing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-cinema-400">Editing list</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
          className="text-muted-foreground"
        >
          Done
        </Button>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2"
        >
          <span className="text-sm truncate">{item.movieTitle}</span>
          <button
            onClick={() => removeItem(item.id, item.movieTitle)}
            disabled={removing === item.id}
            className="flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            {removing === item.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
