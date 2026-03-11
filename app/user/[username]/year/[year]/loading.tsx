export default function YearLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] w-full rounded" />
        ))}
      </div>
    </div>
  )
}
