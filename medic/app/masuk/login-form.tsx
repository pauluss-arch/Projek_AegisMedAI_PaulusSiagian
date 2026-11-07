'use client';

import { useActionState } from 'react';
import { masuk } from './actions';
import type { StatusForm } from '../../lib/status-form';

const statusAwal: StatusForm = {};

export function LoginForm() {
  const [status, aksi, sedangDiproses] = useActionState(masuk, statusAwal);
  const galatNama = status.galat?.namaPengguna;
  const galatSandi = status.galat?.kataSandi;

  return (
    <form action={aksi} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <div>
        <label htmlFor="namaPengguna" className="mb-1.5 block text-sm font-medium text-slate-200">Nama pengguna</label>
        <input
          id="namaPengguna"
          name="namaPengguna"
          autoComplete="username"
          required
          maxLength={100}
          defaultValue={status.nilai?.namaPengguna ?? ''}
          aria-invalid={Boolean(galatNama?.length)}
          aria-describedby={galatNama?.length ? 'namaPengguna-galat' : undefined}
          className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        {galatNama?.map((galat) => <p id="namaPengguna-galat" key={galat} className="mt-1 text-xs text-rose-300">{galat}</p>)}
      </div>

      <div>
        <label htmlFor="kataSandi" className="mb-1.5 block text-sm font-medium text-slate-200">Kata sandi</label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          maxLength={128}
          aria-invalid={Boolean(galatSandi?.length)}
          aria-describedby={galatSandi?.length ? 'kataSandi-galat' : undefined}
          className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        {galatSandi?.map((galat) => <p id="kataSandi-galat" key={galat} className="mt-1 text-xs text-rose-300">{galat}</p>)}
      </div>

      {status.pesan && <p role="status" aria-live="polite" className="text-sm text-rose-200">{status.pesan}</p>}
      <button
        type="submit"
        disabled={sedangDiproses}
        className="min-h-11 w-full rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
      >
        {sedangDiproses ? 'Memeriksa...' : 'Masuk'}
      </button>
    </form>
  );
}
