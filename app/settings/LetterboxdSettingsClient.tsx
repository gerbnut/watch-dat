'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LetterboxdImportModal } from '@/components/import/LetterboxdImportModal'
import { toast } from '@/hooks/use-toast'

interface Props {
  importedAt: string | null
  entryCount: number | null
}

export function LetterboxdSettingsClient({ importedAt, entryCount }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const hasImported = !!importedAt

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch('/api/import/letterboxd', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      toast({ title: 'Import removed', variant: 'success' })
      setConfirmRemove(false)
      router.refresh()
    } catch {
      toast({ title: 'Failed to remove import', variant: 'destructive' })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl bg-card/80 border border-white/[0.04] p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Letterboxd</h2>
          <p className="text-sm text-muted-foreground/70 mt-0.5">
            Import or manage your Letterboxd data
          </p>
        </div>

        {hasImported ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
              <p className="text-sm">
                Last imported:{' '}
                <span className="font-medium">
                  {new Date(importedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
              {entryCount !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {entryCount} entries processed
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Re-import
              </Button>

              {confirmRemove ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Are you sure?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={removing}
                  >
                    {removing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Yes, remove'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRemove(false)}
                    disabled={removing}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRemove(true)}
                  className="text-muted-foreground hover:text-destructive gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove import
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Import your diary and watchlist from Letterboxd to get started quickly.
            </p>
            <Button
              variant="cinema"
              size="sm"
              onClick={() => setShowModal(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import from Letterboxd
            </Button>
          </div>
        )}
      </div>

      <LetterboxdImportModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </>
  )
}
