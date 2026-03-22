'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { UserPlus, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { hapticImpact } from '@/lib/native'
import { cn } from '@/lib/utils'

interface FollowButtonClientProps {
  username: string
  isFollowing: boolean
}

export function FollowButtonClient({ username, isFollowing: initial }: FollowButtonClientProps) {
  const [isFollowing, setIsFollowing] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function toggle() {
    hapticImpact('light')
    setLoading(true)
    const prev = isFollowing
    setIsFollowing(!isFollowing) // optimistic
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' })
      const data = await res.json()
      setIsFollowing(data.following)
    } catch {
      setIsFollowing(prev)
      toast({ title: 'Error', description: 'Could not update follow', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const showUnfollow = isFollowing && hovered

  return (
    <motion.div whileTap={{ scale: 0.93 }} transition={{ duration: 0.1 }}>
      <Button
        variant={isFollowing ? 'cinema-outline' : 'cinema'}
        size="sm"
        onClick={toggle}
        disabled={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'overflow-hidden min-w-[100px] transition-all duration-150',
          !isFollowing && 'shadow-glow-green-sm',
          showUnfollow && 'border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {showUnfollow ? (
            <motion.span
              key="unfollow"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1.5"
            >
              Unfollow
            </motion.span>
          ) : isFollowing ? (
            <motion.span
              key="following"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Following
            </motion.span>
          ) : (
            <motion.span
              key="follow"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Follow
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  )
}
