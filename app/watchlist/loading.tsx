import { MovieGridSkeleton } from '@/components/movies/MovieCardSkeleton'

export default function WatchlistLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="skeleton h-7 w-28 rounded" />
        <div className="skeleton h-4 w-36 rounded" />
      </div>
      <MovieGridSkeleton count={16} size="sm" />
    </div>
  )
}
