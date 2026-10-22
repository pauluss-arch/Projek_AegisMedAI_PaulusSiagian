import type { ReactNode } from 'react';
import { NoteInput } from '../../src/components/NoteInput';

export default function CatalogTemplate({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-900/70 bg-cyan-950/20 p-5">
        <NoteInput label="Note in Template" />
        <p className="mt-2 text-xs text-slate-400">This note resets when navigating between catalog pages.</p>
      </section>
      {children}
    </div>
  );
}
