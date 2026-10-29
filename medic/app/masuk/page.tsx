import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { bacaSesi } from '../../lib/sesi';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Masuk | AegisMed AI',
};

export default async function MasukPage() {
  if (await bacaSesi()) redirect('/catalog');

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Area terproteksi</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Masuk ke katalog</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Mode demo: gunakan nama pengguna dan kata sandi apa saja untuk masuk.</p>
      </header>
      <LoginForm />
    </main>
  );
}
