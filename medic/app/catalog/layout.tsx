import type { ReactNode } from 'react';
import { NoteInput } from '../../src/components/NoteInput';

export default function CatalogLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="h-fit space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Catalog sidebar</h2>
        <NoteInput label="Note in Layout" />
        <p className="text-xs leading-5 text-slate-500">This note stays mounted while you navigate within the catalog.</p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
