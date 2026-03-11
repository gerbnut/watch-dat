export default function UserDiaryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
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
