import { cn } from '@/lib/utils'

const SIZES = {
  xs: { card: 'w-16', img: 'h-24' },
  sm: { card: 'w-24', img: 'h-36' },
  md: { card: 'w-32', img: 'h-48' },
  lg: { card: 'w-44', img: 'h-64' },
}

interface MovieCardSkeletonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function MovieCardSkeleton({ size = 'md', className }: MovieCardSkeletonProps) {
  const { card, img } = SIZES[size]
  return (
    <div className={cn('flex flex-col gap-1.5', card, className)}>
      <div className={cn('skeleton rounded-md', img)} />
      <div className="space-y-1.5 px-0.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-2.5 w-2/3 rounded" />
      </div>
    </div>
  )
}

export function MovieGridSkeleton({ count = 12, size = 'md' }: { count?: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} size={size} />
      ))}
    </div>
  )
}
