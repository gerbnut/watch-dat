'use client'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthlyChartProps {
  data: { month: number; count: number }[]
  highlightPeak?: boolean
}

export function MonthlyChart({ data, highlightPeak = true }: MonthlyChartProps) {
  const filled = MONTHS.map((_, i) => ({
    month: i + 1,
    label: MONTHS[i],
    count: data.find((d) => d.month === i + 1)?.count ?? 0,
  }))

  const max = Math.max(...filled.map((d) => d.count), 1)
  const peak = filled.reduce((a, b) => (a.count >= b.count ? a : b))

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-28">
        {filled.map(({ month, label, count }) => {
          const isPeak = highlightPeak && count > 0 && count === peak.count
          const heightPct = max > 0 ? (count / max) * 100 : 0
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-0 group relative">
              {/* Tooltip */}
              {count > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-cinema-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {count}
                </span>
              )}
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    isPeak
                      ? 'bg-cinema-400'
                      : count > 0
                      ? 'bg-cinema-500/40 group-hover:bg-cinema-500/70'
                      : 'bg-muted/30'
                  }`}
                  style={{ height: `${Math.max(heightPct, count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1">
        {filled.map(({ month, label }) => (
          <div key={month} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
