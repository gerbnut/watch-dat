'use client'

import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  /** If true, prevents closing by tapping the backdrop */
  persistent?: boolean
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  persistent,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Keyboard: close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — mobile only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={persistent ? undefined : onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) onClose()
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh]',
              'rounded-t-2xl bg-card border-t border-border',
              'flex flex-col md:hidden',
              className,
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
                <h2 className="font-semibold text-base">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 -mr-1 hover:bg-accent transition-colors touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div className="overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
