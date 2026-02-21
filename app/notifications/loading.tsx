export default function NotificationsLoading() {
  return (
    <div className="max-w-xl space-y-4">
      <div className="skeleton h-7 w-36 rounded" />
      <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="skeleton h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton h-4 w-4 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
