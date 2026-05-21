export default function CheckoutLoading() {
  return (
    <div className="page-container py-8">
      <div className="skeleton h-8 w-36 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-20 rounded mb-2" />
              <div className="skeleton h-11 w-full rounded" />
            </div>
          ))}
        </div>
        <div className="lg:w-80">
          <div className="skeleton h-64 w-full rounded" />
        </div>
      </div>
    </div>
  )
}
