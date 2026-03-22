'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ListPlus, Loader2, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ListOption {
  id: string
  name: string
  _count: { items: number }
}

export function AddToListButtonClient({ tmdbId }: { tmdbId: number }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lists, setLists] = useState<ListOption[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingNew, setSavingNew] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/lists')
      .then((r) => r.json())
      .then((d) => setLists(d.lists ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setNewName('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  if (!session?.user) return null

  async function addToList(listId: string, listName: string) {
    setAdding(listId)
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to add')
      }
      setAdded((prev) => new Set(prev).add(listId))
      toast({ title: `Added to ${listName}`, variant: 'success' })
      router.refresh()
    } catch (err: any) {
      toast({ title: err.message === 'Movie already in list' ? 'Already in this list' : 'Could not add', variant: 'destructive' })
    } finally {
      setAdding(null)
    }
  }

  async function handleCreateAndAdd() {
    const name = newName.trim()
    if (!name) return
    setSavingNew(true)
    try {
      // Create the list
      const createRes = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isPublic: true }),
      })
      if (!createRes.ok) throw new Error('Failed to create list')
      const newList = await createRes.json()

      // Add the film to it
      await fetch(`/api/lists/${newList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId }),
      })

      setLists((prev) => [{ id: newList.id, name, _count: { items: 1 } }, ...prev])
      setAdded((prev) => new Set(prev).add(newList.id))
      setCreating(false)
      setNewName('')
      toast({ title: `Created "${name}" and added film`, variant: 'success' })
      router.refresh()
    } catch {
      toast({ title: 'Could not create list', variant: 'destructive' })
    } finally {
      setSavingNew(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ListPlus className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-56 rounded-xl border border-white/[0.06] bg-popover shadow-lg overflow-hidden">
          <div className="p-2 border-b border-white/[0.04]">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Add to list</p>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {lists.map((list) => {
                  const isAdded = added.has(list.id)
                  const isAdding = adding === list.id
                  return (
                    <button
                      key={list.id}
                      onClick={() => !isAdded && addToList(list.id, list.name)}
                      disabled={isAdding || isAdded}
                      className={cn(
                        'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-left transition-colors',
                        isAdded
                          ? 'text-cinema-400 bg-cinema-500/5'
                          : 'hover:bg-white/[0.04] text-foreground'
                      )}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      ) : isAdded ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{list.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{list._count.items}</span>
                    </button>
                  )
                })}
                {lists.length === 0 && !creating && (
                  <p className="text-xs text-muted-foreground text-center py-3">No lists yet</p>
                )}
              </>
            )}
          </div>
          <div className="border-t border-white/[0.04] p-1">
            {creating ? (
              <div className="flex items-center gap-1.5 px-1 py-1">
                <Input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                  placeholder="List name..."
                  className="h-8 text-sm"
                  disabled={savingNew}
                />
                <Button
                  size="sm"
                  variant="cinema"
                  className="h-8 px-3 shrink-0"
                  onClick={handleCreateAndAdd}
                  disabled={!newName.trim() || savingNew}
                >
                  {savingNew ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-cinema-400 hover:bg-white/[0.04] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create new list
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
