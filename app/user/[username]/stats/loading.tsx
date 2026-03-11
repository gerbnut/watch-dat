export default function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="skeleton h-8 w-12 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="skeleton h-48 w-full rounded-xl" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  )
}
