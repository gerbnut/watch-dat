'use client'

import { motion } from 'framer-motion'

// Map ISO 3166-1 codes to flag emojis
function isoToFlag(iso: string): string {
  const code = iso.toUpperCase()
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
}

interface TopCountriesSlideProps {
  topCountries: { country: string; iso: string; count: number }[]
}

export function TopCountriesSlide({ topCountries }: TopCountriesSlideProps) {
  const maxCount = Math.max(...topCountries.map(c => c.count), 1)

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-950/30 via-black to-black">
      <div className="relative z-10 text-center px-8 space-y-8 w-full max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest"
        >
          Your films came from
        </motion.p>

        <div className="space-y-3">
          {topCountries.map((country, i) => (
            <motion.div
              key={country.iso}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12 }}
              className="flex items-center gap-3"
            >
              <span className="text-2xl w-8">{isoToFlag(country.iso)}</span>
              <div className="flex-1 text-left">
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-sm font-semibold ${i === 0 ? 'text-cinema-400' : 'text-white/80'}`}>
                    {country.country}
                  </span>
                  <span className="text-xs text-white/40 tabular-nums">{country.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${i === 0 ? 'bg-cinema-400' : 'bg-cinema-500/50'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(country.count / maxCount) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
