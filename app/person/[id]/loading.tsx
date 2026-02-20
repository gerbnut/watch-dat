import { MovieGridSkeleton } from '@/components/movies/MovieCardSkeleton'

export default function PersonLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex gap-6 items-start">
        <div className="skeleton w-28 sm:w-36 shrink-0 rounded-lg" style={{ aspectRatio: '2/3' }} />
        <div className="flex-1 space-y-3 pt-1">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="space-y-2 pt-1">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-4/6 rounded" />
          </div>
        </div>
      </div>

      {/* Films skeleton */}
      <div className="space-y-4">
        <div className="skeleton h-4 w-32 rounded" />
        <MovieGridSkeleton count={12} size="sm" />
      </div>
    </div>
  )
}
