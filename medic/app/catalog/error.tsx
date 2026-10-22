'use client';

type CatalogErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CatalogError({ error, reset }: CatalogErrorProps) {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Catalog error</h1>
      <p role="alert" className="text-sm leading-6 text-rose-200">
        {error.message || 'An unexpected error occurred while loading the catalog.'}
      </p>
      {error.digest && <p className="text-xs text-slate-500">Error reference: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="min-h-10 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#06101c] hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        Try again
      </button>
    </main>
  );
}
