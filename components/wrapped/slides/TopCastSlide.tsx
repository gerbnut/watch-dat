'use client'

import { motion } from 'framer-motion'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface TopCastSlideProps {
  topCast: { id: number; name: string; profilePath: string | null; count: number }[]
}

export function TopCastSlide({ topCast }: TopCastSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-cinema-950/40 via-black to-black">
      <div className="relative z-10 text-center px-6 space-y-8 w-full max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest"
        >
          Your most-watched actors
        </motion.p>

        <div className="space-y-4">
          {topCast.map((actor, i) => {
            const profileUrl = TMDB_IMAGE.profile(actor.profilePath, 'w185')
            return (
              <motion.div
                key={actor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="flex items-center gap-4"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/[0.05] shrink-0 ring-2 ring-white/[0.06]">
                  {profileUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileUrl}
                      alt={actor.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-lg font-bold">
                      {actor.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-semibold truncate ${i === 0 ? 'text-cinema-400' : 'text-white/90'}`}>
                    {actor.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {actor.count} film{actor.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-2xl font-black text-white/20 tabular-nums">
                  #{i + 1}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
