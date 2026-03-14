export default function FilmLoading() {
  return (
    <div className="-mt-6">
      {/* Hero backdrop skeleton */}
      <div className="relative -mx-4">
        <div className="skeleton h-[300px] sm:h-[400px] w-full" />

        {/* Poster + info skeleton */}
        <div className="relative -mt-32 sm:-mt-40 z-10 px-4 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="w-32 sm:w-44 shrink-0 mx-auto sm:mx-0">
              <div className="skeleton aspect-[2/3] rounded-xl" />
            </div>
            <div className="flex-1 space-y-3 sm:pt-8 text-center sm:text-left">
              <div className="skeleton h-8 w-64 rounded mx-auto sm:mx-0" />
              <div className="skeleton h-4 w-48 rounded mx-auto sm:mx-0" />
              <div className="skeleton h-4 w-36 rounded mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Action bar skeleton */}
      <div className="skeleton h-16 w-full rounded-2xl mt-6" />

      {/* Stats skeleton */}
      <div className="flex items-center gap-6 py-4 mt-2">
        <div className="skeleton h-8 w-28 rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4">
        <div className="space-y-8">
          {/* Overview */}
          <div className="space-y-2">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>

          {/* Cast */}
          <div className="space-y-3">
            <div className="skeleton h-4 w-12 rounded" />
            <div className="flex gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shrink-0 w-20 space-y-1.5">
                  <div className="skeleton h-20 w-20 rounded-full mx-auto" />
                  <div className="skeleton h-3 w-16 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Review cards */}
          <div className="space-y-3">
            <div className="skeleton h-5 w-20 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-40 w-full rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Sidebar skeleton — desktop */}
        <aside className="hidden lg:block space-y-6">
          <div className="skeleton h-48 w-full rounded-xl" />
          <div className="skeleton h-36 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  )
}
