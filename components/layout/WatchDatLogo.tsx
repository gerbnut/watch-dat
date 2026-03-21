interface LogoMarkProps {
  className?: string
  size?: number
}

/**
 * Watch Dat owl logo — white owl face with cinema-reel eyes (green).
 * `size` sets the rendered width; height scales proportionally (64:50 aspect).
 * Default size=32 matches the navbar.
 */
export function WatchDatLogoMark({ className, size = 32 }: LogoMarkProps) {
  const h = Math.round(size * (50 / 64))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 64 50"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Owl head */}
      <ellipse cx="32" cy="28" rx="27" ry="19" fill="white" />

      {/* Ear tufts */}
      <polygon points="11,17 7,3 21,15" fill="white" />
      <polygon points="53,17 57,3 43,15" fill="white" />

      {/* Left eye — cinema reel */}
      <circle cx="21" cy="26" r="9" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
      <circle cx="21" cy="21" r="2" fill="#0d1117" />
      <circle cx="21" cy="31" r="2" fill="#0d1117" />
      <circle cx="16" cy="26" r="2" fill="#0d1117" />
      <circle cx="26" cy="26" r="2" fill="#0d1117" />
      <circle cx="21" cy="26" r="1.8" fill="#0d1117" />

      {/* Right eye — cinema reel */}
      <circle cx="43" cy="26" r="9" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
      <circle cx="43" cy="21" r="2" fill="#0d1117" />
      <circle cx="43" cy="31" r="2" fill="#0d1117" />
      <circle cx="38" cy="26" r="2" fill="#0d1117" />
      <circle cx="48" cy="26" r="2" fill="#0d1117" />
      <circle cx="43" cy="26" r="1.8" fill="#0d1117" />

      {/* Beak */}
      <polygon points="32,37 29.5,42 34.5,42" fill="#10b981" />
    </svg>
  )
}
