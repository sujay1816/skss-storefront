export default function OrdersLoading() {
  return (
    <div className="page-container py-8">
      <div className="skeleton h-8 w-40 rounded mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-white space-y-3" style={{ border: '1px solid var(--border)' }}>
            <div className="flex justify-between">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-5 w-20 rounded" />
            </div>
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-4 w-28 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
