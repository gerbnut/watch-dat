'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface EditListContextValue {
  isEditing: boolean
  handleRemove: (itemId: string) => Promise<void>
}

const EditListContext = createContext<EditListContextValue>({
  isEditing: false,
  handleRemove: async () => {},
})

export function useEditList() {
  return useContext(EditListContext)
}

interface EditListClientProps {
  listId: string
  canEdit: boolean
  itemLabels: Record<string, string>
  children: React.ReactNode
}

export function EditListClient({ listId, canEdit, itemLabels, children }: EditListClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const handleRemove = useCallback(async (itemId: string) => {
    const title = itemLabels[itemId] ?? 'film'

    const res = await fetch(`/api/lists/${listId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    })

    if (!res.ok) {
      toast({ title: 'Failed to remove', variant: 'destructive' })
      throw new Error('Failed to remove')
    }

    toast({ title: `Removed ${title}` })
    router.refresh()
  }, [listId, itemLabels, router])

  if (!canEdit) {
    return <>{children}</>
  }

  return (
    <EditListContext.Provider value={{ isEditing, handleRemove }}>
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className={
              isEditing
                ? 'gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10'
                : 'gap-1.5 text-muted-foreground hover:text-foreground'
            }
          >
            <Pencil className="h-3.5 w-3.5" />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>
        {children}
      </div>
    </EditListContext.Provider>
  )
}
