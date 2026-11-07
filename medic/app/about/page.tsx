import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | AegisMed AI',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">About the product</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">AegisMed AI</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          AegisMed AI is a clinical decision-support demonstration for differential diagnosis, rare-disease exploration, and antimicrobial stewardship.
        </p>
      </header>

      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">The problem it addresses</h2>
        <p className="leading-7 text-slate-300">
          Clinical information can be difficult to bring together during an assessment. The application organizes symptom matching and reference information into one workflow to support review; it does not replace clinical judgment.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Who it is for</h2>
        <p className="leading-7 text-slate-300">
          The intended audience is healthcare professionals and students learning about clinical decision-support workflows, diagnostic reasoning, and responsible antimicrobial use.
        </p>
      </section>
    </main>
  );
}
