import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { getPatientById } from '../../actions/patientActions';
import { bacaSesi } from '../../../lib/sesi';
import { Badge } from '../../../src/components/UI/Badge';
import { Card } from '../../../src/components/UI/Card';

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await bacaSesi())) redirect('/masuk');
  const { id } = await params;
  const patient = await getPatientById(id);
  if (!patient) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/?tab=history" className="inline-flex min-h-[42px] items-center gap-2 rounded-lg text-sm font-semibold text-cyan-200 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">
        <ArrowLeft size={16} /> Back to assessment history
      </Link>

      <section className="space-y-5">
        <header>
          <p className="flex items-center gap-2 font-mono text-xs text-cyan-200"><Clock3 size={14} />{new Date(patient.createdAt).toLocaleString()}</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Assessment details</h1>
          <p className="mt-2 text-sm text-slate-400">Patient reference: <span className="font-mono text-slate-300">{patient.medicalRecordNum}</span></p>
        </header>

        <Card title="Patient safety context" subtitle="Pseudonymized patient record">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Age</dt><dd className="mt-1 text-slate-200">{patient.age} years</dd></div>
            <div><dt className="text-xs text-slate-500">Gender</dt><dd className="mt-1 capitalize text-slate-200">{patient.gender}</dd></div>
            <div><dt className="text-xs text-slate-500">eGFR</dt><dd className="mt-1 text-slate-200">{patient.eGFR} mL/min</dd></div>
            <div><dt className="text-xs text-slate-500">Penicillin allergy reported</dt><dd className="mt-1 text-slate-200">{patient.hasPenicillinAlg ? 'Yes' : 'No'}</dd></div>
          </dl>
        </Card>

        <Card title="Recorded findings" subtitle="Educational decision-support signals; not a diagnosis or substitute for clinical judgment">
          {patient.diagnoses.length ? (
            <ul className="space-y-3">
              {patient.diagnoses.map((diagnosis) => (
                <li key={diagnosis.id} className="rounded-lg bg-[#0b0f19] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-100">{diagnosis.diseaseName}</h2>
                      <p className="mt-1 text-xs text-slate-400">ICD code: {diagnosis.icdCode}</p>
                    </div>
                    <Badge variant="cyan">{diagnosis.matchPercentage}% match signal</Badge>
                  </div>
                  <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div><dt className="text-slate-500">Recorded</dt><dd className="mt-1 text-slate-300">{new Date(diagnosis.createdAt).toLocaleString()}</dd></div>
                    <div><dt className="text-slate-500">Selected therapy</dt><dd className="mt-1 text-slate-300">{diagnosis.prescribedDrug ?? 'None recorded'}</dd></div>
                    <div><dt className="text-slate-500">Signature</dt><dd className="mt-1"><Badge variant={diagnosis.digitalSignature ? 'green' : 'amber'}>{diagnosis.digitalSignature ? 'Demo integrity marker' : 'Not signed'}</Badge></dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">No findings were recorded for this assessment.</p>}
        </Card>
        <p className="text-xs leading-5 text-slate-500">Demonstration only. Not certified for clinical use or regulatory compliance; use synthetic data only.</p>
      </section>
    </main>
  );
}
