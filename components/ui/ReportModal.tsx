'use client'

import { useState } from 'react'
import { Loader2, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const REASONS = [
  { value: 'SPAM', label: 'Spam or scam' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'HATE_SPEECH', label: 'Hate speech' },
  { value: 'MISINFORMATION', label: 'False information' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'OTHER', label: 'Other' },
] as const

interface Props {
  open: boolean
  onClose: () => void
  targetType: 'USER' | 'REVIEW' | 'COMMENT'
  targetId: string
  targetLabel?: string
}

export function ReportModal({ open, onClose, targetType, targetId, targetLabel }: Props) {
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function handleClose() {
    setReason('')
    setDetails('')
    setDone(false)
    onClose()
  }

  async function handleSubmit() {
    if (!reason) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to submit report')
      }
      setDone(true)
      toast({ title: 'Report submitted', description: 'Thanks for keeping Watch Dat safe.' })
      setTimeout(handleClose, 1500)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold text-base">Report {targetType.toLowerCase()}</h2>
          {targetLabel && <span className="text-xs text-muted-foreground truncate">— {targetLabel}</span>}
        </div>

        {done ? (
          <div className="py-6 text-center space-y-2">
            <p className="font-medium text-sm">Report submitted</p>
            <p className="text-xs text-muted-foreground">We'll review this and take appropriate action.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Why are you reporting this?</p>
              <div className="space-y-1">
                {REASONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setReason(value)}
                    className={cn(
                      'w-full text-left text-sm px-3 py-2 rounded-md border transition-colors',
                      reason === value
                        ? 'border-cinema-500 bg-cinema-500/10 text-cinema-400'
                        : 'border-border hover:border-border/80 hover:bg-accent/50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {reason && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Additional details (optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context…"
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 gap-1.5"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit report'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
