import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { getDiagnosisRecord } from '../../actions/patientActions';
import { bacaSesi } from '../../../lib/sesi';
import { Badge } from '../../../src/components/UI/Badge';
import { Card } from '../../../src/components/UI/Card';

export const dynamic = 'force-dynamic';

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await bacaSesi())) redirect('/masuk');
  const { id } = await params;
  const assessment = await getDiagnosisRecord(id);

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex min-h-[42px] items-center gap-2 rounded-lg text-sm font-semibold text-cyan-200 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">
        <ArrowLeft size={16} /> Back to AegisMed
      </Link>

      {!assessment ? (
        <Card className="space-y-3">
          <h1 className="text-xl font-bold text-white">Assessment not found</h1>
          <p className="text-sm leading-6 text-slate-400">This diagnosis record may have been deleted or the link may be invalid.</p>
        </Card>
      ) : (
        <section className="space-y-5">
          <header>
            <p className="flex items-center gap-2 font-mono text-xs text-cyan-200"><Clock3 size={14} />{new Date(assessment.createdAt).toLocaleString()}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Assessment details</h1>
            <p className="mt-2 text-sm text-slate-400">Medical record number: <span className="font-mono text-slate-300">{assessment.patientMedicalRecordNum}</span></p>
          </header>

          <Card title="Recorded finding" subtitle="Persisted PostgreSQL record; not a diagnosis or substitute for clinical judgment">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0b0f19] p-4">
              <div>
                <h2 className="font-semibold text-slate-100">{assessment.diseaseName}</h2>
                <p className="mt-1 text-xs text-slate-400">ICD code: {assessment.icdCode}</p>
              </div>
              <Badge variant="cyan">{assessment.matchPercentage}% match signal</Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-300">Symptoms entered</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{assessment.symptomsInput}</p>
            </div>
          </Card>

          <Card title="Audit details">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Signature status</dt><dd className="mt-1"><Badge variant={assessment.digitalSignature ? 'green' : 'amber'}>{assessment.digitalSignature ? 'Demo signature confirmed' : 'Not signed'}</Badge></dd></div>
              <div><dt className="text-xs text-slate-500">Selected therapy</dt><dd className="mt-1 text-slate-200">{assessment.prescribedDrug ?? 'None recorded'}</dd></div>
            </dl>
          </Card>
          <p className="text-xs leading-5 text-slate-500">This demonstration is not certified for clinical use or regulatory compliance. Use synthetic data only.</p>
        </section>
      )}
    </main>
  );
}
