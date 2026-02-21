'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      className="overflow-hidden min-w-[88px]"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isFollowing ? (
          <motion.span
            key="following"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1.5"
          >
            <UserMinus className="h-4 w-4" /> Unfollow
          </motion.span>
        ) : (
          <motion.span
            key="follow"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" /> Follow
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}
