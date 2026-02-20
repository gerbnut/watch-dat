import { MovieGridSkeleton } from '@/components/movies/MovieCardSkeleton'

export default function FilmsLoading() {
  return (
    <div className="space-y-10">
      {/* Section heading skeleton */}
      <div className="space-y-4">
        <div className="skeleton h-5 w-36 rounded" />
        <MovieGridSkeleton count={10} size="md" />
      </div>
      <div className="space-y-4">
        <div className="skeleton h-5 w-32 rounded" />
        <MovieGridSkeleton count={10} size="md" />
      </div>
    </div>
  )
}
