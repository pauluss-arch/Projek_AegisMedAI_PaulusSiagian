import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">404 · Page not found</p>
      <h1 className="text-3xl font-bold text-white">This page does not exist</h1>
      <p className="leading-7 text-slate-300">The page may have moved or the address may be incorrect.</p>
      <Link href="/" className="inline-flex min-h-10 items-center font-semibold text-cyan-300 hover:text-cyan-200">
        Return home
      </Link>
    </main>
  );
}
