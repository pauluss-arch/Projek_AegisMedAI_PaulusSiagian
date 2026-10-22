import type { Dispatch, SetStateAction } from 'react';
import { AlertTriangle, CheckCircle2, Pill } from 'lucide-react';
import type { AllergyKey, Disease, PatientState } from '../types';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

type Props = {
  disease?: Disease;
  patient: PatientState;
  onPatientChange: Dispatch<SetStateAction<PatientState>>;
};

const allergyOptions: Array<{ key: AllergyKey; label: string }> = [
  { key: 'penicillin', label: 'Penicillin / beta-lactam' },
  { key: 'sulfa', label: 'Sulfonamide' },
  { key: 'macrolide', label: 'Macrolide' },
];

export function AntibioticChecker({ disease, patient, onPatientChange }: Props) {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <Card title="Antibiotic safety review" subtitle={disease ? `${disease.name} · individualized context` : 'Set patient factors or select a differential diagnosis to review therapy notes.'}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="checker-egfr" className="mb-2 flex justify-between text-xs font-semibold text-slate-300">
              <span>Renal function (eGFR)</span><span className="font-mono text-cyan-200">{patient.egfr} mL/min/1.73m²</span>
            </label>
            <input id="checker-egfr" type="range" min="5" max="120" value={patient.egfr} onChange={(event) => onPatientChange((current) => ({ ...current, egfr: Number(event.target.value) }))} className="w-full accent-cyan-400" aria-valuetext={`${patient.egfr} mL/min per 1.73 square meters`} />
            <p className="mt-1 text-[10px] text-slate-500">A low eGFR is not converted to a fixed percentage dose reduction. Adjustments depend on the specific drug and protocol.</p>
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-semibold text-slate-300">Reported allergy classes</legend>
            {allergyOptions.map(({ key, label }) => <label key={key} className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={patient.allergies.includes(key)} onChange={() => onPatientChange((current) => ({ ...current, allergies: current.allergies.includes(key) ? current.allergies.filter((item) => item !== key) : [...current.allergies, key] }))} className="accent-cyan-400" />{label}</label>)}
          </fieldset>
        </div>
      </Card>
      <Card title={disease ? 'Therapy & contraindication review' : 'No diagnosis selected'} subtitle={disease ? 'Illustrative reference notes only · no prescription or dose is generated' : 'Choose a result from Patient diagnosis'}>
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-xs leading-5 text-amber-100/80"><AlertTriangle className="mr-2 inline h-4 w-4 text-amber-300" />Not a prescribing tool. Verify indication, allergy phenotype, renal function, culture data, interactions, and the current local protocol with a qualified clinician or pharmacist.</div>
        {!disease ? <p className="text-sm text-slate-400">Run an assessment and select a diagnosis card to view its mock therapy notes.</p> :
          disease.recommendedAntibiotics.length === 0 ? <p className="text-sm text-slate-400">No antimicrobial therapy is listed. Antibiotics are not routinely appropriate for some conditions; follow clinician-directed care.</p> :
            <div className="space-y-3">{disease.recommendedAntibiotics.map((therapy) => {
              const conflicts = therapy.contraindications.filter((allergy) => patient.allergies.includes(allergy));
              const renalNote = therapy.egfrAdjustments.find((adjustment) => patient.egfr < adjustment.below);
              return <article key={therapy.id} className={`rounded-xl border p-4 ${conflicts.length ? 'border-rose-400/30 bg-rose-400/[0.04]' : 'border-slate-800 bg-[#0b0f19]'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3"><Pill className={`mt-1 h-4 w-4 ${conflicts.length ? 'text-rose-300' : 'text-cyan-300'}`} /><div><h3 className="text-sm font-semibold text-white">{therapy.name}</h3><p className="mt-1 text-[10px] text-slate-500">{therapy.className}</p></div></div>
                  <Badge variant={conflicts.length ? 'danger' : therapy.status === 'Specialist therapy' ? 'purple' : 'info'}>{conflicts.length ? 'Potential allergy conflict' : therapy.status}</Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{therapy.note}</p>
                <p className="mt-2 text-[10px] text-slate-500">Dose guidance: {therapy.dosage} {therapy.baseDose}</p>
                {renalNote && <p className="mt-2 text-[10px] leading-5 text-amber-200">Renal review required (eGFR below {renalNote.below}): {renalNote.guidance}</p>}
                {conflicts.length ? <p role="alert" className="mt-2 text-xs text-rose-200">Reported allergy class conflict: {conflicts.join(', ')}. This flag is not a complete allergy or cross-reactivity assessment.</p> : <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-300"><CheckCircle2 size={12} /> No selected allergy-class conflict detected (not a safety clearance).</p>}
              </article>;
            })}</div>}
      </Card>
    </section>
  );
}
