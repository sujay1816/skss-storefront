export default function ProfileLoading() {
  return (
    <div className="page-container py-8 max-w-2xl">
      <div className="skeleton h-8 w-32 rounded mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton h-3 w-20 rounded mb-2" />
            <div className="skeleton h-11 w-full rounded" />
          </div>
        ))}
        <div className="skeleton h-11 w-36 rounded mt-4" />
      </div>
    </div>
  )
}
