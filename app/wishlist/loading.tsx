export default function WishlistLoading() {
  return (
    <div className="page-container py-8">
      <div className="skeleton h-8 w-36 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white overflow-hidden" style={{ border: '1px solid var(--border)', borderRadius: 4 }}>
            <div className="skeleton" style={{ aspectRatio: '2/3' }} />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-4 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
