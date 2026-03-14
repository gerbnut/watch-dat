'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedLikeButtonProps {
  isLiked: boolean
  likeCount: number
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function AnimatedLikeButton({
  isLiked,
  likeCount,
  onClick,
  disabled,
  size = 'md',
}: AnimatedLikeButtonProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 text-sm select-none touch-manipulation',
        'transition-colors duration-150',
        isLiked
          ? 'text-red-400'
          : 'text-muted-foreground/60 hover:text-red-400/70 active:text-red-400',
        disabled && 'opacity-70',
      )}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.5, 0.8, 1.15, 1] } : { scale: 1 }}
        transition={{
          duration: 0.3,
          times: [0, 0.2, 0.5, 0.8, 1],
        }}
        className="flex items-center justify-center"
      >
        <Heart
          className={cn(
            iconSize,
            'transition-none',
            isLiked && 'fill-current',
          )}
        />
      </motion.div>

      <AnimatePresence mode="popLayout" initial={false}>
        {likeCount > 0 && (
          <motion.span
            key={likeCount}
            initial={{ y: isLiked ? -8 : 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isLiked ? 8 : -8, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="tabular-nums"
          >
            {likeCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
