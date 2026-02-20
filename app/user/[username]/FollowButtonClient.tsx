'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface FollowButtonClientProps {
  username: string
  isFollowing: boolean
}

export function FollowButtonClient({ username, isFollowing: initial }: FollowButtonClientProps) {
  const [isFollowing, setIsFollowing] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const prev = isFollowing
    setIsFollowing(!isFollowing) // optimistic
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' })
      const data = await res.json()
      setIsFollowing(data.following)
    } catch {
      setIsFollowing(prev)
      toast({ title: 'Error', description: 'Failed to update follow', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'cinema'}
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {isFollowing ? (
        <><UserMinus className="h-4 w-4" /> Unfollow</>
      ) : (
        <><UserPlus className="h-4 w-4" /> Follow</>
      )}
    </Button>
  )
}
