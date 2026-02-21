'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ReportModal } from './ReportModal'
import { cn } from '@/lib/utils'

interface Props {
  targetType: 'USER' | 'REVIEW' | 'COMMENT'
  targetId: string
  targetLabel?: string
  className?: string
}

export function ReportButton({ targetType, targetId, targetLabel, className }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session?.user) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`Report ${targetType.toLowerCase()}`}
        className={cn(
          'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors',
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        <span className="sr-only">Report</span>
      </button>
      <ReportModal
        open={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
      />
    </>
  )
}
