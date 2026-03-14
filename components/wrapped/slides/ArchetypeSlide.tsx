'use client'

import { motion } from 'framer-motion'

interface ArchetypeSlideProps {
  label: string
  description: string
}

export function ArchetypeSlide({ label, description }: ArchetypeSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-cinema-950 via-black to-cinema-950">
      <div className="relative z-10 text-center px-8 space-y-6 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-cinema-400 text-xs uppercase tracking-widest"
        >
          Your viewing archetype
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-cinema-400"
          style={{ textShadow: '0 0 80px rgba(74, 222, 128, 0.4)' }}
        >
          &ldquo;{label}&rdquo;
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-white/60 text-sm leading-relaxed"
        >
          {description}
        </motion.p>
      </div>
    </div>
  )
}
