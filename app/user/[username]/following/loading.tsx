export default function FollowingLoading() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="space-y-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
