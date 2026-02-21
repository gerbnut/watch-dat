'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function DeleteAccountClient() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')

  async function handleDelete() {
    setStep('deleting')
    try {
      const res = await fetch('/api/users/me/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Deletion failed')
      // Sign out and redirect home — account is gone
      await signOut({ callbackUrl: '/' })
    } catch {
      toast({ title: 'Deletion failed', description: 'Please try again.', variant: 'destructive' })
      setStep('idle')
    }
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Permanently deletes your account, all reviews, diary entries, lists, and follows.
          This cannot be undone.
        </p>
      </div>

      {step === 'idle' && (
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => setStep('confirm')}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete my account
        </Button>
      )}

      {step === 'confirm' && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-destructive w-full">
            Are you sure? This is permanent and immediate.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Yes, delete everything
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('idle')}
          >
            Cancel
          </Button>
        </div>
      )}

      {step === 'deleting' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Deleting your account…
        </div>
      )}
    </div>
  )
}
