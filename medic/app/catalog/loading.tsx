export default function CatalogLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-5" aria-label="Loading catalog">
      <span className="sr-only">Loading catalog...</span>
      <div className="h-8 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((placeholder) => (
          <div key={placeholder} className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        ))}
      </div>
    </div>
  );
}
