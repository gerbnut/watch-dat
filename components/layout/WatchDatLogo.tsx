interface LogoMarkProps {
  className?: string
  size?: number
}

/**
 * The WatchDat "film-lens eye" mark.
 * Uses currentColor — wrap in a colored element or pass className with text-*.
 * Default size=28 matches the navbar usage.
 */
export function WatchDatLogoMark({ className, size = 28 }: LogoMarkProps) {
  const h = Math.round(size * (20 / 28))
  return (
    <svg width={size} height={h} viewBox="0 0 28 20" fill="none" className={className}>
      {/* Eye outline */}
      <path
        d="M1.5 10 C5 4 23 4 26.5 10 C23 16 5 16 1.5 10 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Film-frame viewfinder corners */}
      <path
        d="M8.5 8 L8.5 6 L10.5 6 M17.5 6 L19.5 6 L19.5 8 M19.5 12 L19.5 14 L17.5 14 M10.5 14 L8.5 14 L8.5 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Iris / pupil */}
      <circle cx="14" cy="10" r="1.4" fill="currentColor" />
    </svg>
  )
}
