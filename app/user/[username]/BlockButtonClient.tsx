'use client'

import { useState } from 'react'
import { ShieldOff, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface Props {
  username: string
  isBlocked: boolean
}

export function BlockButtonClient({ username, isBlocked: initial }: Props) {
  const [isBlocked, setIsBlocked] = useState(initial)
  const [loading, setLoading] = useState(false)
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
      <div className="flex gap-1.5">
        <Button variant="destructive" size="sm" onClick={toggle} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
          Confirm block
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1.5 text-muted-foreground hover:text-destructive"
    >
      <ShieldOff className="h-4 w-4" />
      Block
    </Button>
  )
}
