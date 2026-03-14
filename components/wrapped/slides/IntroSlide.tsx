'use client'

import { motion } from 'framer-motion'
import { SlideBackdrop } from '../SlideBackdrop'

interface IntroSlideProps {
  displayName: string
  backdrop: string | null
}

export function IntroSlide({ displayName, backdrop }: IntroSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center">
      <SlideBackdrop backdrop={backdrop} gradient="from-black/95 via-black/70 to-black/95" />
      {/* Film grain texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      <div className="relative z-10 text-center px-8 space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-cinema-400 text-sm font-medium uppercase tracking-[0.3em]"
        >
          Presenting
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl font-black tracking-tight"
        >
          {displayName}&rsquo;s<br />
          <span className="text-cinema-400">Film Wrapped</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-white/50 text-sm"
        >
          Your all-time cinema story
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="text-white/30 text-xs"
        >
          Tap to continue
        </motion.div>
      </div>
    </div>
  )
}
