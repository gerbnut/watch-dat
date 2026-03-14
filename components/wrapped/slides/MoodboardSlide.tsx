'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface MoodboardSlideProps {
  moodboard: { backdrop: string; title: string }[]
}

export function MoodboardSlide({ moodboard }: MoodboardSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-black">
      <div className="relative z-10 w-full h-full flex flex-col">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest text-center pt-16 pb-4"
        >
          Your cinema moodboard
        </motion.p>

        <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-1 px-4 pb-16">
          {moodboard.slice(0, 6).map((item, i) => {
            const url = TMDB_IMAGE.backdrop(item.backdrop, 'w780')
            return (
              <motion.div
                key={item.backdrop}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="relative overflow-hidden rounded-lg"
              >
                {url && (
                  <Image src={url} alt={item.title} fill className="object-cover" sizes="50vw" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-1 left-2 right-2 text-[9px] text-white/70 font-medium truncate">
                  {item.title}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
