'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface FriendCompatibilitySlideProps {
  friend: { username: string; displayName: string; avatar: string | null }
  overlapPercent: number
  sharedCount: number
  sharedPosters: string[]
}

export function FriendCompatibilitySlide({
  friend,
  overlapPercent,
  sharedCount,
  sharedPosters,
}: FriendCompatibilitySlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-pink-950/30 via-black to-black">
      <div className="relative z-10 text-center px-8 space-y-6 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-pink-400 text-xs uppercase tracking-widest"
        >
          Film soulmate
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.05] ring-2 ring-pink-500/30">
            {friend.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={friend.avatar} alt={friend.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xl font-bold">
                {friend.displayName[0]}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-lg font-bold">{friend.displayName}</p>
          <p className="text-white/50 text-sm">@{friend.username}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="inline-block rounded-xl bg-pink-500/15 border border-pink-500/25 px-6 py-3"
        >
          <p className="text-3xl font-black text-pink-400">{overlapPercent}%</p>
          <p className="text-xs text-pink-400/70">compatibility</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-white/50 text-sm"
        >
          {sharedCount} film{sharedCount !== 1 ? 's' : ''} in common
        </motion.p>

        {sharedPosters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="flex justify-center gap-2"
          >
            {sharedPosters.slice(0, 5).map((poster, i) => {
              const url = TMDB_IMAGE.poster(poster, 'w154')
              return url ? (
                <div key={i} className="w-12 h-[72px] rounded-md overflow-hidden bg-white/[0.05]">
                  <Image src={url} alt="" width={48} height={72} className="object-cover w-full h-full" />
                </div>
              ) : null
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
