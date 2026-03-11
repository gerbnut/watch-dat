export default function UserListsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="skeleton h-16 flex-1 rounded" />
              ))}
            </div>
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
