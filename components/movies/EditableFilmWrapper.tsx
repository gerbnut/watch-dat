'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Loader2 } from 'lucide-react'

interface EditableFilmWrapperProps {
  id: string
  label: string
  isEditing: boolean
  onRemove: (id: string) => Promise<void>
  children: React.ReactNode
}

export function EditableFilmWrapper({
  id,
  label,
  isEditing,
  onRemove,
  children,
}: EditableFilmWrapperProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  async function handleRemove() {
    if (isRemoving) return
    setIsRemoving(true)
    try {
      await onRemove(id)
    } catch {
      setIsRemoving(false)
    }
  }

  return (
    <AnimatePresence mode="popLayout">
      {!isRemoving ? (
        <motion.div
          key={id}
          layout
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
          className="relative"
        >
          {/* Red minus badge */}
          <AnimatePresence>
            {isEditing && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={handleRemove}
                className="absolute -top-1.5 -left-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-lg border-2 border-background cursor-pointer hover:bg-red-400 active:scale-90 transition-colors"
                aria-label={`Remove ${label}`}
              >
                <Minus className="h-3 w-3 text-white stroke-[3]" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Block navigation clicks while editing */}
          <div className={isEditing ? 'pointer-events-none' : undefined}>
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
