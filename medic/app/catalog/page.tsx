import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ambilItem } from '../../lib/data';
import { bacaSesi } from '../../lib/sesi';
import { ItemForm } from './item-form';
import { keluar } from './actions';

export const metadata: Metadata = {
  title: 'Catalog | AegisMed AI',
};

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const sesi = await bacaSesi();
  if (!sesi) redirect('/masuk');

  const items = ambilItem();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">AegisMed AI</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Clinical tools catalog</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Hello, {sesi.namaPengguna}. Manage clinical catalog items.</p>
        </div>
        <form action={keluar}>
          <button type="submit" className="min-h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            Sign out
          </button>
        </form>
      </header>

      <section aria-labelledby="item-baru" className="space-y-4">
        <h2 id="item-baru" className="text-xl font-semibold text-white">Add item</h2>
        <ItemForm />
      </section>

      <section aria-labelledby="daftar-item" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="daftar-item" className="text-xl font-semibold text-white">Catalog items</h2>
          <span className="text-sm text-slate-400">{items.length} items</span>
        </div>
        {items.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-white">{item.judul}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.aktif ? 'bg-emerald-400/10 text-emerald-200' : 'bg-slate-700 text-slate-200'}`}>
                    {item.aktif ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.deskripsi}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-slate-800 p-5 text-sm text-slate-300">No catalog items yet.</p>
        )}
      </section>
    </main>
  );
}
