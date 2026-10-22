import Link from 'next/link';

export default function CatalogNotFound() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">404 · Catalog</p>
      <h1 className="text-2xl font-bold text-white">Catalog item not found</h1>
      <p className="leading-7 text-slate-300">The requested item does not exist or its ID is invalid.</p>
      <Link href="/catalog" className="inline-flex min-h-10 items-center font-semibold text-cyan-300 hover:text-cyan-200">
        Return to the catalog
      </Link>
    </main>
  );
}
