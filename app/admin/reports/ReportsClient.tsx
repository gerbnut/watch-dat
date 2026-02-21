'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { CheckCircle, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Report {
  id: string
  targetType: 'USER' | 'REVIEW' | 'COMMENT'
  targetId: string
  reason: string
  details: string | null
  resolved: boolean
  createdAt: string
  reporter: { id: string; username: string; displayName: string }
}

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate speech',
  MISINFORMATION: 'Misinformation',
  INAPPROPRIATE_CONTENT: 'Inappropriate',
  OTHER: 'Other',
}

function targetLink(type: Report['targetType'], id: string) {
  if (type === 'REVIEW') return `/review/${id}`
  if (type === 'USER') return `/user/${id}`
  return null
}

export function ReportsClient({ initialReports }: { initialReports: Report[] }) {
  const router = useRouter()
  const [reports, setReports] = useState(initialReports)
  const [loading, setLoading] = useState<string | null>(null)

  async function action(reportId: string, act: 'resolve' | 'dismiss' | 'remove') {
    setLoading(reportId)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: act }),
      })
      if (!res.ok) throw new Error()
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast({ title: act === 'remove' ? 'Content removed' : 'Report resolved', variant: 'success' })
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <CheckCircle className="h-10 w-10 text-cinema-500 mx-auto mb-3" />
        <p className="text-muted-foreground">No pending reports. All clear!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const link = targetLink(report.targetType, report.targetId)
        return (
          <div key={report.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">{report.targetType}</Badge>
                  <Badge variant="secondary" className="text-xs">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Reported by </span>
                  <Link href={`/user/${report.reporter.username}`} className="font-medium text-cinema-400 hover:underline">
                    @{report.reporter.username}
                  </Link>
                </p>
                {report.details && (
                  <p className="text-sm text-muted-foreground italic">"{report.details}"</p>
                )}
                {link && (
                  <Link
                    href={link}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-cinema-400 hover:underline"
                  >
                    View content <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t">
              <Button
                size="sm"
                variant="outline"
                disabled={loading === report.id}
                onClick={() => action(report.id, 'resolve')}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Dismiss
              </Button>
              {(report.targetType === 'REVIEW' || report.targetType === 'COMMENT') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={loading === report.id}
                  onClick={() => action(report.id, 'remove')}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove content
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
