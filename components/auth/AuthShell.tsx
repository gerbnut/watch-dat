'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CINEMATIC_BACKDROPS } from '@/lib/cinematic-backdrops'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { WatchDatLogoMark } from '@/components/layout/WatchDatLogo'

export function AuthShell({ children }: { children: React.ReactNode }) {
  const [backdrop, setBackdrop] = useState<{ path: string; title: string }>(CINEMATIC_BACKDROPS[0])

  useEffect(() => {
    const random = CINEMATIC_BACKDROPS[Math.floor(Math.random() * CINEMATIC_BACKDROPS.length)]
    setBackdrop(random)
  }, [])

  return (
    <div className="relative z-50 flex min-h-[100dvh] items-center justify-center overflow-y-auto">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={TMDB_IMAGE.backdrop(backdrop.path, 'w1280')!}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 my-8">
        <div className="rounded-2xl bg-card/80 border border-white/[0.04] p-6 sm:p-8 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="mb-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cinema-950 border border-cinema-800/60 mb-3">
              <WatchDatLogoMark className="text-cinema-400" size={30} />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
