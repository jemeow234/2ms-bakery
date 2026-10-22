// Shown while a server-rendered page (admin, order tracking) loads.
export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
