export default function ProductLoading() {
  return (
    <div className="page-container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image column */}
        <div className="lg:w-1/2 space-y-3">
          <div className="skeleton w-full rounded" style={{ aspectRatio: '3/4' }} />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton rounded" style={{ width: 72, height: 90, flexShrink: 0 }} />
            ))}
          </div>
        </div>
        {/* Info column */}
        <div className="lg:w-1/2 space-y-4">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-9 w-3/4 rounded" />
          <div className="skeleton h-8 w-1/3 rounded" />
          <div className="skeleton h-px w-full" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/6 rounded" />
          </div>
          <div className="skeleton h-px w-full" />
          <div className="flex gap-3">
            <div className="skeleton h-13 flex-1 rounded" />
            <div className="skeleton h-13 w-13 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
