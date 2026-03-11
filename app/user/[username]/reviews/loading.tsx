export default function UserReviewsLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex gap-3">
              <div className="skeleton h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-2/5 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
              <div className="skeleton h-12 w-8 rounded shrink-0" />
            </div>
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
