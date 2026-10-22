import Link from 'next/link';
import { catalogItems } from '../../src/catalogData';

export default function CatalogPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">AegisMed AI</p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Clinical tools catalog</h1>
        <p className="max-w-2xl leading-7 text-slate-300">
          Browse the decision-support areas available in this demonstration.
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {catalogItems.map((item) => (
          <li key={item.id}>
            <Link
              href={`/catalog/${item.id}`}
              className="block h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <h2 className="text-lg font-semibold text-white">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-cyan-300">View details →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
