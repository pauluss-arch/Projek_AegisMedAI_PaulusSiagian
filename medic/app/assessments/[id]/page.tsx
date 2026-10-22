'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { Badge } from '../../../src/components/UI/Badge';
import { Card } from '../../../src/components/UI/Card';
import type { AssessmentHistoryEntry } from '../../../src/types';
import { migrateHistory, STORAGE_KEY } from '../../../src/utils/assessmentStorage';

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: AssessmentHistoryEntry }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setState({ status: 'not-found' });
        return;
      }

      const stored: unknown = JSON.parse(raw);
      if (!stored || typeof stored !== 'object' || !('history' in stored)) {
        throw new Error('The saved assessment history has an invalid format.');
      }

      const historyValue = (stored as { history: unknown }).history;
      if (!Array.isArray(historyValue)) {
        throw new Error('The saved assessment history has an invalid format.');
      }
      const history = migrateHistory(historyValue);
      const entry = history.find((item) => item.id === id);
      setState(entry ? { status: 'loaded', entry } : { status: 'not-found' });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Assessment history could not be read from this browser.',
      });
    }
  }, [id]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex min-h-[42px] items-center gap-2 rounded-lg text-sm font-semibold text-cyan-200 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">
        <ArrowLeft size={16} /> Back to AegisMed
      </Link>

      {state.status === 'loading' && <Card className="text-sm text-slate-300">Loading assessment from this browser...</Card>}
      {state.status === 'not-found' && (
        <Card className="space-y-3">
          <h1 className="text-xl font-bold text-white">Assessment not found</h1>
          <p className="text-sm leading-6 text-slate-400">This assessment may have been cleared, or it may not exist in this browser’s local history.</p>
        </Card>
      )}
      {state.status === 'error' && (
        <Card className="space-y-3">
          <h1 className="text-xl font-bold text-white">Could not load assessment</h1>
          <p role="alert" className="text-sm leading-6 text-rose-200">{state.message}</p>
        </Card>
      )}
      {state.status === 'loaded' && (
        <section className="space-y-5">
          <header>
            <p className="flex items-center gap-2 font-mono text-xs text-cyan-200"><Clock3 size={14} />{new Date(state.entry.timestamp).toLocaleString()}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Assessment details</h1>
            <p className="mt-2 text-sm text-slate-400">Patient reference: <span className="font-mono text-slate-300">{state.entry.patientHashId || 'Not assigned'}</span></p>
          </header>

          <Card title="Recorded findings" subtitle="Local history record; not a diagnosis or substitute for clinical judgment">
            {state.entry.diagnoses.length ? (
              <ul className="space-y-3">
                {state.entry.diagnoses.map((diagnosis) => (
                  <li key={`${diagnosis.name}-${diagnosis.icd11}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0b0f19] p-4">
                    <div>
                      <h2 className="font-semibold text-slate-100">{diagnosis.name}</h2>
                      <p className="mt-1 text-xs text-slate-400">ICD-11: {diagnosis.icd11}</p>
                    </div>
                    <Badge variant="cyan">{diagnosis.probability}% match signal</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400">No findings were recorded for this assessment.</p>}
          </Card>

          <Card title="Audit details">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Signature status</dt><dd className="mt-1"><Badge variant={state.entry.signatureStatus === 'Not signed' ? 'amber' : 'green'}>{state.entry.signatureStatus}</Badge></dd></div>
              <div><dt className="text-xs text-slate-500">Selected therapy</dt><dd className="mt-1 text-slate-200">{state.entry.prescribedAntibiotic ?? 'None recorded'}</dd></div>
            </dl>
          </Card>
          <p className="text-xs leading-5 text-slate-500">This demonstration keeps records in browser storage only. It is not certified for clinical use or regulatory compliance.</p>
        </section>
      )}
    </main>
  );
}
