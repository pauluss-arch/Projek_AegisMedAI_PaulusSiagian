import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogItems } from '../../../src/catalogData';

type CatalogItemPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return [{ id: '1' }];
}

export async function generateMetadata({ params }: CatalogItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = catalogItems.find((entry) => entry.id === id);

  return { title: item ? `${item.name} | AegisMed AI` : 'Catalog item | AegisMed AI' };
}

export default async function CatalogItemPage({ params }: CatalogItemPageProps) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const item = catalogItems.find((entry) => entry.id === id);
  if (!item) notFound();

  return (
    <main className="space-y-6">
      <Link href="/catalog" className="inline-flex min-h-10 items-center text-sm font-semibold text-cyan-300 hover:text-cyan-200">
        ← Back to catalog
      </Link>
      <article className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Catalog item {item.id}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{item.name}</h1>
        </div>
        <p className="max-w-3xl leading-7 text-slate-300">{item.description}</p>
        <section className="border-t border-slate-800 pt-5">
          <h2 className="text-sm font-semibold text-slate-200">Intended audience</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.audience}</p>
        </section>
        <p className="text-xs leading-5 text-slate-500">
          Demonstration information only. This tool does not provide a diagnosis or replace professional clinical judgment.
        </p>
      </article>
    </main>
  );
}
