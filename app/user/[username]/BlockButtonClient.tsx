'use client'

import { useState, useEffect } from 'react'
import { ShieldOff, Shield, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface Props {
  username: string
  isBlocked: boolean
}

export function BlockButtonClient({ username, isBlocked: initial }: Props) {
  const [isBlocked, setIsBlocked] = useState(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setIsBlocked(initial) }, [initial])
  const [confirming, setConfirming] = useState(false)

  async function toggle() {
    if (!isBlocked && !confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/block`, { method: 'POST' })
      const data = await res.json()
      setIsBlocked(data.blocked)
      toast({
        title: data.blocked ? `Blocked @${username}` : `Unblocked @${username}`,
        description: data.blocked ? 'You won\'t see their content.' : 'You can now see their content again.',
      })
    } catch {
      toast({ title: 'Error', description: 'Failed to update block status', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (isBlocked) {
    return (
      <Button variant="outline" size="sm" onClick={toggle} disabled={loading} className="gap-1.5 text-muted-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
        Blocked
      </Button>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          disabled={loading}
          title="Confirm block"
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setConfirming(false)}
          title="Cancel"
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={toggle}
      title="Block user"
      className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
    >
      <ShieldOff className="h-3.5 w-3.5" />
    </button>
  )
}
