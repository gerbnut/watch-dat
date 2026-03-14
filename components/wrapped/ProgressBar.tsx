'use client'

interface ProgressBarProps {
  total: number
  current: number
}

export function ProgressBar({ total, current }: ProgressBarProps) {
  return (
    <div className="flex gap-1 px-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-[2px] flex-1 rounded-full overflow-hidden bg-white/20"
        >
          <div
            className="h-full bg-white transition-all duration-300 ease-out rounded-full"
            style={{
              width: i < current ? '100%' : i === current ? '100%' : '0%',
              opacity: i < current ? 0.7 : i === current ? 1 : 0,
            }}
          />
        </div>
      ))}
    </div>
  )
}
