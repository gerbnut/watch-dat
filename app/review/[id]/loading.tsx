export default function ReviewLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex gap-6">
        <div className="skeleton w-28 h-40 rounded shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="skeleton h-5 w-32 rounded" />
          <div className="flex items-center gap-2 mt-4">
            <div className="skeleton h-8 w-8 rounded-full shrink-0" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-8 w-20 rounded-lg" />
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}
