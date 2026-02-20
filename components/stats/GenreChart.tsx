'use client'

interface GenreChartProps {
  data: { genre_name: string; count: number }[]
  limit?: number
}

export function GenreChart({ data, limit = 10 }: GenreChartProps) {
  const sliced = data.slice(0, limit)
  const max = Math.max(...sliced.map((d) => d.count), 1)

  return (
    <div className="space-y-2.5">
      {sliced.map((item, i) => {
        const pct = (item.count / max) * 100
        const opacity = 1 - i * 0.06
        return (
          <div key={item.genre_name} className="flex items-center gap-3 group">
            <span className="text-xs text-muted-foreground w-24 shrink-0 truncate group-hover:text-foreground transition-colors">
              {item.genre_name}
            </span>
            <div className="flex-1 h-4 bg-muted/40 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: `rgba(34, 197, 94, ${opacity * 0.65})`,
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-cinema-400 w-7 text-right shrink-0">
              {item.count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
