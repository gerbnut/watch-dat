export default function DiaryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-32 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>
      </div>

      {/* Month group */}
      {[6, 4, 5].map((count, gi) => (
        <div key={gi} className="space-y-3">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="space-y-1">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-16 space-y-1 text-right">
                  <div className="skeleton h-3 w-10 rounded ml-auto" />
                  <div className="skeleton h-6 w-6 rounded ml-auto" />
                </div>
                <div className="skeleton w-10 h-16 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
                <div className="skeleton h-4 w-16 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
