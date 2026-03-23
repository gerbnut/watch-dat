'use client'

const CHART_HEIGHT = 96 // matches h-24

interface RatingChartProps {
  data: { rating: number; _count: { id: number } }[]
}

export function RatingChart({ data }: RatingChartProps) {
  // Build all 1–10 steps
  const steps: { value: number; count: number }[] = []
  for (let i = 1; i <= 10; i++) {
    const entry = data.find((d) => d.rating === i)
    steps.push({ value: i, count: entry?._count.id ?? 0 })
  }

  const max = Math.max(...steps.map((s) => s.count), 1)

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-0.5" style={{ height: CHART_HEIGHT }}>
        {steps.map(({ value, count }) => {
          const barHeight = Math.max((count / max) * CHART_HEIGHT, count > 0 ? 4 : 0)
          return (
            <div key={value} className="flex-1 flex items-end group relative">
              {count > 0 && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-cinema-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {count}
                </span>
              )}
              <div
                className={`w-full rounded-t transition-all duration-300 group-hover:bg-cinema-400 ${
                  count > 0 ? 'bg-cinema-500/50' : 'bg-muted/20'
                }`}
                style={{ height: barHeight }}
              />
            </div>
          )
        })}
      </div>
      {/* X-axis */}
      <div className="flex gap-0.5">
        {steps.map(({ value }) => (
          <div key={value} className="flex-1 text-center">
            {value % 2 === 0 ? (
              <span className="text-[8px] text-muted-foreground">{value}</span>
            ) : (
              <span className="text-[8px] text-transparent">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
