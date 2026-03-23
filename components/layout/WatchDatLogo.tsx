import Image from 'next/image'

interface LogoMarkProps {
  className?: string
  size?: number
}

/**
 * Watch Dat owl logo mark.
 * `size` sets the rendered width & height (square).
 * Default size=32 matches the navbar.
 */
export function WatchDatLogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="Watch Dat"
      width={size}
      height={size}
      className={className}
      priority={size >= 30}
    />
  )
}
