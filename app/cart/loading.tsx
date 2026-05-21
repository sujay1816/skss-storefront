export default function CartLoading() {
  return (
    <div className="page-container py-8">
      <div className="skeleton h-8 w-32 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white" style={{ border: '1px solid var(--border)' }}>
              <div className="skeleton rounded" style={{ width: 80, height: 100, flexShrink: 0 }} />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-4 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:w-80">
          <div className="skeleton h-48 w-full rounded" />
        </div>
      </div>
    </div>
  )
}
