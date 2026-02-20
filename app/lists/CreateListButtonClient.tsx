'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Loader2, Globe, Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import TextareaAutosize from 'react-textarea-autosize'

interface CreateListButtonClientProps {
  variant?: 'default' | 'cinema' | 'outline' | 'ghost'
}

export function CreateListButtonClient({ variant = 'default' }: CreateListButtonClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, isPublic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'List created!', variant: 'success' as any })
      setOpen(false)
      setName('')
      setDescription('')
      router.refresh()
      router.push(`/list/${data.id}`)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant={variant as any} size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New list
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Films that changed my life"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description (optional)</label>
              <TextareaAutosize
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this list about?"
                minRows={2}
                maxRows={5}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPublic(!isPublic)}
                className="flex items-center gap-2 text-sm"
              >
                {isPublic ? (
                  <><Globe className="h-4 w-4 text-emerald-400" /> Public</>
                ) : (
                  <><Lock className="h-4 w-4 text-muted-foreground" /> Private</>
                )}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="cinema" onClick={handleCreate} disabled={!name.trim() || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create list'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
