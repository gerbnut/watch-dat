import Image from 'next/image'

interface LogoMarkProps {
  className?: string
  size?: number
}

/**
 * Watch Dat owl logo mark.
 * `size` sets the rendered width; height scales proportionally (588:460 aspect).
 * Default size=32 matches the navbar.
 */
export function WatchDatLogoMark({ className, size = 32 }: LogoMarkProps) {
  const h = Math.round(size * (460 / 588))
  return (
    <Image
      src="/logo.png"
      alt="Watch Dat"
      width={size}
      height={h}
      className={className}
      priority={size >= 30}
    />
  )
}
