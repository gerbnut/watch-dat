interface LogoMarkProps {
  className?: string
  size?: number
}

/**
 * Watch Dat owl logo — dark body, circular green film-reel wings, green eyes.
 * `size` sets the rendered width; height scales proportionally (56:48 aspect).
 * Default size=32 matches the navbar.
 */
export function WatchDatLogoMark({ className, size = 32 }: LogoMarkProps) {
  const h = Math.round(size * (48 / 56))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 56 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Left film-reel wing */}
      <circle cx="10" cy="26" r="10" fill="#10b981" />
      <circle cx="10" cy="26" r="3.5" fill="#0d1117" />
      <circle cx="10" cy="19.5" r="1.8" fill="#0d1117" />
      <circle cx="15.6" cy="29.3" r="1.8" fill="#0d1117" />
      <circle cx="4.4" cy="29.3" r="1.8" fill="#0d1117" />

      {/* Right film-reel wing */}
      <circle cx="46" cy="26" r="10" fill="#10b981" />
      <circle cx="46" cy="26" r="3.5" fill="#0d1117" />
      <circle cx="46" cy="19.5" r="1.8" fill="#0d1117" />
      <circle cx="51.6" cy="29.3" r="1.8" fill="#0d1117" />
      <circle cx="40.4" cy="29.3" r="1.8" fill="#0d1117" />

      {/* Owl body */}
      <ellipse cx="28" cy="40" rx="9.5" ry="7.5" fill="#1a1a1a" />

      {/* Owl head */}
      <circle cx="28" cy="22" r="13.5" fill="#1a1a1a" />

      {/* Ear tufts */}
      <polygon points="20,10 17,3 24,12" fill="#1a1a1a" />
      <polygon points="36,10 32,12 39,3" fill="#1a1a1a" />

      {/* Left eye (green) */}
      <circle cx="22.5" cy="21" r="5.5" fill="#10b981" />
      <circle cx="23" cy="21.5" r="3.2" fill="#0d1117" />
      <circle cx="21.5" cy="19.8" r="1" fill="white" opacity="0.7" />

      {/* Right eye (green) */}
      <circle cx="33.5" cy="21" r="5.5" fill="#10b981" />
      <circle cx="33" cy="21.5" r="3.2" fill="#0d1117" />
      <circle cx="32" cy="19.8" r="1" fill="white" opacity="0.7" />

      {/* Beak */}
      <polygon points="28,25 26,28.5 30,28.5" fill="#10b981" />

      {/* Feet */}
      <path d="M23 46.5 L21 48 M23 46.5 L23 48 M23 46.5 L25 48" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33 46.5 L31 48 M33 46.5 L33 48 M33 46.5 L35 48" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
