interface LogoMarkProps {
  className?: string
  size?: number
}

/**
 * The Midnight Reeler — minimal owl with film-reel wings.
 * Uses currentColor so wrap in text-cinema-400 etc. for color.
 * White eyes and #0d1117 pupils are hardcoded.
 * Default size=28 matches the navbar.
 */
export function WatchDatLogoMark({ className, size = 28 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Left film-reel wing — pie wedge with perforation holes */}
      <path
        fillRule="evenodd"
        d="M17 23 L5.7 11.7 A16 16 0 0 1 5.7 34.3 Z
           M8 16.5 h2.5 v2.2 h-2.5 Z
           M8 26.5 h2.5 v2.2 h-2.5 Z"
        fill="currentColor"
        opacity="0.85"
      />

      {/* Right film-reel wing — mirror */}
      <path
        fillRule="evenodd"
        d="M27 23 L38.3 11.7 A16 16 0 0 0 38.3 34.3 Z
           M33.5 16.5 h2.5 v2.2 h-2.5 Z
           M33.5 26.5 h2.5 v2.2 h-2.5 Z"
        fill="currentColor"
        opacity="0.85"
      />

      {/* Owl body */}
      <ellipse cx="22" cy="36" rx="10" ry="8.5" fill="currentColor" />

      {/* Owl head */}
      <circle cx="22" cy="20" r="13" fill="currentColor" />

      {/* Left ear tuft */}
      <polygon points="16,9 12,1 20,11" fill="currentColor" />

      {/* Right ear tuft */}
      <polygon points="28,9 24,11 32,1" fill="currentColor" />

      {/* Left eye */}
      <circle cx="17" cy="19" r="5.5" fill="white" />
      <circle cx="17.5" cy="19.5" r="3.3" fill="#0d1117" />
      <circle cx="16" cy="17.5" r="1.1" fill="white" />

      {/* Right eye */}
      <circle cx="27" cy="19" r="5.5" fill="white" />
      <circle cx="26.5" cy="19.5" r="3.3" fill="#0d1117" />
      <circle cx="26" cy="17.5" r="1.1" fill="white" />
    </svg>
  )
}
