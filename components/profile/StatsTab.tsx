'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface Stats {
  totalFilms: number
  percentile: number
  avgPerWeek: number
  rewatchPercent: number
  totalWords: number
  avgWordsPerReview: number
  reviewCount: number
  totalHours: number
}

const PERIODS = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All Time', value: 'all' },
] as const

export function StatsTab({
  username,
  wrappedEligible,
  favoritePosterUrls,
}: {
  username: string
  wrappedEligible: boolean
  favoritePosterUrls: string[]
}) {
  const [period, setPeriod] = useState<string>('all')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/stats?period=${p}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setStats(json)
    } catch (err) {
      console.error('Stats load error:', err)
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    load(period)
  }, [period, load])

  return (
    <div className="space-y-5">
      {/* Wrapped CTA */}
      {wrappedEligible && (
        <Link href={`/user/${username}/wrapped`} className="block">
          <div className="rounded-xl bg-gradient-to-r from-cinema-950 via-cinema-900/50 to-cinema-950 border border-cinema-500/20 p-4 flex items-center justify-between hover:border-cinema-500/40 hover:shadow-glow-green-xs transition-all">
            <div className="flex items-center gap-3">
              {favoritePosterUrls.length > 0 && (
                <div className="flex -space-x-2">
                  {favoritePosterUrls.slice(0, 3).map((url, i) => (
                    <div key={i} className="relative h-10 w-7 rounded overflow-hidden ring-1 ring-black/50">
                      <Image src={url} alt="" fill className="object-cover" sizes="28px" />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <p className="font-bold text-sm">Your All-Time Wrapped</p>
                <p className="text-xs text-muted-foreground/60">Your cinema story</p>
              </div>
            </div>
            <span className="text-cinema-400 text-lg">→</span>
          </div>
        </Link>
      )}

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-cinema-400/20 text-cinema-400 border border-cinema-400/30'
                : 'bg-white/[0.03] text-muted-foreground/60 border border-white/[0.04] hover:bg-white/[0.06]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* By the Numbers */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/40">By the Numbers</h3>

      {loading && !stats ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-5 space-y-2">
              <div className="skeleton h-8 w-16 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            value={stats.totalFilms.toLocaleString()}
            label="Total Logged"
            badge={stats.percentile <= 50 ? `Top ${stats.percentile}%` : undefined}
            loading={loading}
          />
          <StatCard value={stats.totalFilms.toLocaleString()} label="Movies" loading={loading} />
          <StatCard value={stats.avgPerWeek.toString()} label="Avg Per Week" loading={loading} />
          <StatCard value={`${stats.rewatchPercent}%`} label="Rewatches" loading={loading} />
          <StatCard value={stats.totalHours.toLocaleString()} label="Total Hours" loading={loading} />
          <StatCard value={stats.reviewCount.toLocaleString()} label="Reviews" loading={loading} />
          <StatCard
            value={stats.totalWords.toLocaleString()}
            label="Words Written"
            loading={loading}
          />
          <StatCard value={stats.avgWordsPerReview.toLocaleString()} label="Avg Words / Review" loading={loading} />
        </div>
      ) : null}
    </div>
  )
}

function StatCard({
  value,
  label,
  badge,
  loading,
}: {
  value: string
  label: string
  badge?: string
  loading?: boolean
}) {
  return (
    <div className={`rounded-xl bg-white/[0.03] border border-white/[0.04] p-5 transition-opacity ${loading ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cinema-400/15 text-cinema-400 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground/60 mt-1">{label}</p>
    </div>
  )
}
