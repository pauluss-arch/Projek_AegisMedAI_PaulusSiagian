'use client';

import { useActionState } from 'react';
import { simpanItem } from './actions';
import type { StatusForm } from '../../lib/status-form';

const statusAwal: StatusForm = {};

export function ItemForm() {
  const [status, aksi, sedangDiproses] = useActionState(simpanItem, statusAwal);
  const galatJudul = status.galat?.judul;
  const galatDeskripsi = status.galat?.deskripsi;

  return (
    <form action={aksi} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div>
        <label htmlFor="judul" className="mb-1.5 block text-sm font-medium text-slate-200">Title</label>
        <input
          id="judul"
          name="judul"
          required
          minLength={3}
          maxLength={100}
          defaultValue={status.nilai?.judul ?? ''}
          aria-invalid={Boolean(galatJudul?.length)}
          aria-describedby={galatJudul?.length ? 'judul-galat' : undefined}
          className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        {galatJudul?.map((galat) => <p id="judul-galat" key={galat} className="mt-1 text-xs text-rose-300">{galat}</p>)}
      </div>

      <div>
        <label htmlFor="deskripsi" className="mb-1.5 block text-sm font-medium text-slate-200">Description</label>
        <textarea
          id="deskripsi"
          name="deskripsi"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          defaultValue={status.nilai?.deskripsi ?? ''}
          aria-invalid={Boolean(galatDeskripsi?.length)}
          aria-describedby={galatDeskripsi?.length ? 'deskripsi-galat' : undefined}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        {galatDeskripsi?.map((galat) => <p id="deskripsi-galat" key={galat} className="mt-1 text-xs text-rose-300">{galat}</p>)}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          name="aktif"
          value="true"
          defaultChecked={status.nilai?.aktif === 'true'}
          aria-invalid={Boolean(status.galat?.aktif?.length)}
          aria-describedby={status.galat?.aktif?.length ? 'aktif-galat' : undefined}
          className="h-4 w-4 accent-cyan-400"
        />
        Active
      </label>
      {status.galat?.aktif?.map((galat) => <p id="aktif-galat" key={galat} className="text-xs text-rose-300">{galat}</p>)}

      {status.pesan && <p role="status" aria-live="polite" className="text-sm text-rose-200">{status.pesan}</p>}
      <button
        type="submit"
        disabled={sedangDiproses}
        className="min-h-11 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
      >
        {sedangDiproses ? 'Saving...' : 'Save item'}
      </button>
    </form>
  );
}
