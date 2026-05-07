'use client'

import { motion } from 'framer-motion'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { ShareButton } from '@/components/ui/ShareButton'

interface ShareCardSlideProps {
  username: string
  displayName: string
  totalFilms: number
  totalHours: number
  topGenre: string | null
  archetype: string
  moodboard: { backdrop: string; title: string }[]
}

export function ShareCardSlide({
  username,
  displayName,
  totalFilms,
  totalHours,
  topGenre,
  archetype,
  moodboard,
}: ShareCardSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-black px-6">
      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* The card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden bg-gradient-to-b from-cinema-950 to-black border border-cinema-500/20"
        >
          {/* Moodboard strip */}
          {moodboard.length >= 3 && (
            <div className="grid grid-cols-3 h-28">
              {moodboard.slice(0, 3).map((item) => {
                const url = TMDB_IMAGE.backdrop(item.backdrop, 'w780')
                return (
                  <div key={item.backdrop} className="relative overflow-hidden">
                    {url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="p-5 space-y-4">
            <div>
              <p className="text-lg font-black">{displayName}</p>
              <p className="text-xs text-white/40">@{username}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-lg bg-white/[0.04] p-2.5">
                <p className="text-xl font-black text-cinema-400 tabular-nums">{totalFilms}</p>
                <p className="text-[9px] text-white/50 uppercase tracking-wide">Films</p>
              </div>
              <div className="text-center rounded-lg bg-white/[0.04] p-2.5">
                <p className="text-xl font-black text-cinema-400 tabular-nums">{totalHours}</p>
                <p className="text-[9px] text-white/50 uppercase tracking-wide">Hours</p>
              </div>
              <div className="text-center rounded-lg bg-white/[0.04] p-2.5">
                <p className="text-xl font-black text-cinema-400 truncate">{topGenre ?? '...'}</p>
                <p className="text-[9px] text-white/50 uppercase tracking-wide">Top Genre</p>
              </div>
            </div>

            <div className="rounded-xl bg-cinema-500/10 border border-cinema-500/20 p-3 text-center">
              <p className="text-xs text-cinema-400/70 uppercase tracking-wide mb-1">Archetype</p>
              <p className="text-sm font-bold text-cinema-400">&ldquo;{archetype}&rdquo;</p>
            </div>

            <p className="text-[10px] text-white/20 text-center">Watch Dat Film Wrapped</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-4"
        >
          <ShareButton
            url={`/user/${username}/wrapped`}
            title={`${displayName}'s Film Wrapped - Watch Dat`}
            text={`I've watched ${totalFilms} films! My archetype: "${archetype}". Check out my Film Wrapped on Watch Dat.`}
          />
          <p className="text-white/30 text-xs">Screenshot to share</p>
        </motion.div>
      </div>
    </div>
  )
}
