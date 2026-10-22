import { Clock3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { AssessmentHistoryEntry } from '../types';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Card } from '../components/UI/Card';

export function AuditHistory({ entries, onClear }: { entries: AssessmentHistoryEntry[]; onClear: () => void }) {
  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Local session records</p><h2 className="mt-1 text-xl font-bold text-white">Diagnostic history & audit log</h2><p className="mt-1 text-xs text-slate-400">Stored in this browser only. No patient name is saved to the audit log.</p></div><Button type="button" variant="danger" onClick={onClear} disabled={!entries.length}><Trash2 size={14} /> Clear history</Button></div>
    {!entries.length ? <Card className="py-12 text-center text-sm text-slate-400">No evaluations recorded in this browser yet.</Card> : entries.map((entry) => <Card key={entry.id}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-mono text-xs text-cyan-200"><Clock3 size={13} />{new Date(entry.timestamp).toLocaleString()}</p><p className="mt-2 text-[10px] text-slate-500">Patient reference: {entry.patientHashId}</p></div><Badge variant={entry.signatureStatus === 'Not signed' ? 'amber' : 'green'}>{entry.signatureStatus}</Badge></div>
        <ul className="mt-4 space-y-2">{entry.diagnoses.map((diagnosis) => <li key={`${diagnosis.name}-${diagnosis.icd11}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#0b0f19] px-3 py-2 text-xs"><span className="font-medium text-slate-200">{diagnosis.name}<span className="ml-2 text-[10px] text-slate-500">{diagnosis.icd11}</span></span><Badge variant="cyan">{diagnosis.probability}% match signal</Badge></li>)}</ul>
        <p className="mt-3 text-[10px] text-slate-500">Selected therapy: {entry.prescribedAntibiotic ?? 'None recorded'}</p>
        <Link href={`/assessments/${encodeURIComponent(entry.id)}`} className="mt-4 inline-flex min-h-[42px] items-center rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">View assessment</Link>
    </Card>)}
  </section>;
}
