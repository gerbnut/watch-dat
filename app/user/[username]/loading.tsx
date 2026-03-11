export default function UserProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="skeleton h-32 w-full" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="skeleton h-20 w-20 rounded-full border-4 border-background" />
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
          <div className="flex gap-6 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <div className="skeleton h-5 w-10 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-4 rounded-xl border bg-card">
          <div className="skeleton h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/5 rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
