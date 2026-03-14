export default function UserProfileLoading() {
  return (
    <div className="-mt-6">
      {/* Banner skeleton */}
      <div className="relative -mx-4">
        <div className="skeleton h-36 sm:h-48 w-full" />
      </div>

      {/* Avatar skeleton — overlapping banner */}
      <div className="relative -mt-12 sm:-mt-16 z-10">
        <div className="flex items-end justify-between gap-3">
          <div className="skeleton h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-background ml-4 sm:ml-6" />
          <div className="skeleton h-9 w-24 rounded-lg mr-1" />
        </div>

        {/* Name + bio skeleton */}
        <div className="mt-3 px-1 space-y-2">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
      </div>

      {/* Stats pills skeleton */}
      <div className="flex items-center gap-3 py-4 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-20 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-1 border-b border-white/[0.04] pb-px mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-20 rounded-t-lg" />
        ))}
      </div>

      {/* Content skeleton — activity cards */}
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-4">
            <div className="skeleton h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/5 rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-20 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
