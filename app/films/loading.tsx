import { MovieCardSkeleton } from '@/components/movies/MovieCardSkeleton'

function RowSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <MovieCardSkeleton key={i} size="sm" className="shrink-0" />
        ))}
      </div>
    </div>
  )
}

export default function FilmsLoading() {
  return (
    <div className="space-y-8">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-24 rounded-full" />
        ))}
      </div>
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </div>
  )
}
