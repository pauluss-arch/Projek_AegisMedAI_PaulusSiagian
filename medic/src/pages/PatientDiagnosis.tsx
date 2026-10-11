import { Activity, AlertTriangle, FileText, Search, ShieldCheck, Sparkles } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { DiagnosisMatch, PatientState } from '../types';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Input } from '../components/UI/Input';
import { Textarea } from '../components/UI/Textarea';

type Props = {
  patient: PatientState;
  setPatient: Dispatch<SetStateAction<PatientState>>;
  matches: DiagnosisMatch[];
  onEvaluate: () => void;
  onSelect: (match: DiagnosisMatch) => void;
  onPreset: (key: string) => void;
  hasEvaluated: boolean;
};

export function PatientDiagnosis(props: Props) {
  const { patient, setPatient, matches, onEvaluate, onSelect, onPreset, hasEvaluated } = props;
  const allergyLabels = [['penicillin', 'Penicillin / beta-lactam'], ['sulfa', 'Sulfonamide'], ['macrolide', 'Macrolide']] as const;
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="space-y-5">
        <Card title="Patient assessment" subtitle="Enter symptoms to create a local, illustrative differential.">
          <div className="space-y-4">
            <Input id="patient-name" label="Patient name" autoComplete="off" value={patient.rawName} onChange={(e) => setPatient((current) => ({ ...current, rawName: e.target.value }))} placeholder="e.g. Jordan Lee" helperText="Converted locally to a pseudonymous ID on submission; the name is then cleared." />
            <div className="grid grid-cols-2 gap-3">
              <Input id="patient-age" label="Age (years)" type="number" min="0" max="120" value={patient.age} onChange={(e) => setPatient((current) => ({ ...current, age: e.target.value }))} placeholder="Years" />
              <div><label htmlFor="patient-gender" className="mb-2 block text-xs font-semibold text-slate-300">Gender (optional)</label><select id="patient-gender" value={patient.gender} onChange={(e) => setPatient((current) => ({ ...current, gender: e.target.value as PatientState['gender'] }))} className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"><option value="">Not provided</option><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option><option value="unknown">Unknown</option></select></div>
            </div>
            <Textarea id="symptoms" label="Clinical symptoms" value={patient.symptomsRaw} onChange={(e) => setPatient((current) => ({ ...current, symptomsRaw: e.target.value }))} rows={5} placeholder="Describe the presenting symptoms, onset, duration, and relevant findings..." helperText="Matching is local to this browser; include symptoms in the patient's own words." />
            <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-3"><span className="text-[10px] font-semibold text-slate-400">Patient reference</span><p className="mt-1 break-all font-mono text-xs text-cyan-200">{patient.hashedId || 'Created after assessment'}</p></div>
            <div><div className="mb-2 text-xs font-semibold text-slate-300">Clinical presets</div><div className="flex flex-wrap gap-2">{[['cap', 'CAP pneumonia'], ['uti', 'UTI'], ['fabry', 'Fabry crisis'], ['gbs', 'GBS']].map(([key, label]) => <Button key={key} type="button" className="min-h-8 px-3 py-1 text-[11px]" onClick={() => onPreset(key)}>{label}</Button>)}</div></div>
            <Button type="button" variant="primary" className="w-full" onClick={onEvaluate} disabled={!patient.symptomsRaw.trim()}><Search size={15} /> Generate differential <span aria-hidden="true">→</span></Button>
          </div>
        </Card>
        <Card title="Safety context" subtitle="For demonstration only; not a dosing calculator.">
          <label htmlFor="egfr" className="mb-2 flex justify-between text-xs text-slate-300"><span>eGFR</span><strong className="text-cyan-200">{patient.egfr} mL/min/1.73m²</strong></label>
          <input id="egfr" type="range" min="5" max="120" value={patient.egfr} onChange={(e) => setPatient((current) => ({ ...current, egfr: Number(e.target.value) }))} className="w-full accent-cyan-400" />
          <fieldset className="mt-4 space-y-2"><legend className="mb-2 text-xs font-semibold text-slate-300">Reported allergies</legend>{allergyLabels.map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={patient.allergies.includes(key)} onChange={() => setPatient((current) => ({ ...current, allergies: current.allergies.includes(key) ? current.allergies.filter((x) => x !== key) : [...current.allergies, key] }))} className="accent-cyan-400" />{label}</label>)}</fieldset>
        </Card>
      </section>
      <section aria-live="polite" className="space-y-5">
        <Card className="border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.06] to-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Decision support workspace</p><h2 className="mt-2 text-xl font-bold text-white">Differential overview</h2><p className="mt-1 text-xs leading-5 text-slate-400">Pattern matching is educational only and cannot diagnose, rule out, or recommend treatment.</p></div><Badge variant="cyan"><ShieldCheck size={12} className="mr-1" /> SHA-256 pseudonym · local demo</Badge></div>
        </Card>
        {matches.length > 0 ? <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-white">{hasEvaluated ? 'Potential matches' : 'Live symptom signals'}</h3><span className="text-[10px] text-slate-500">{matches.length} results</span></div>
          <Card title="Match score analytics" subtitle="Relative pattern-match estimates; not disease probabilities or validated predictions">
            <div className="space-y-3" role="img" aria-label="Horizontal bars visualizing heuristic match scores">
              {matches.slice(0, 5).map((match) => <div key={match.disease.id}>
                <div className="mb-1 flex justify-between gap-3 text-[10px]"><span className="truncate text-slate-300">{match.disease.name}</span><span className="shrink-0 font-mono text-cyan-200">{match.probability}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${match.disease.rare ? 'bg-purple-400' : 'bg-cyan-400'}`} style={{ width: `${match.probability}%` }} /></div>
              </div>)}
            </div>
          </Card>
          {matches.map((match, i) => <button type="button" key={match.disease.id} onClick={() => onSelect(match)} className="w-full text-left">
            <Card className="group transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-slate-900"><div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-800 font-mono text-xs text-cyan-200">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold text-white group-hover:text-cyan-100">{match.disease.name}</h4><Badge variant={match.disease.rare ? 'Rare Disease' : 'cyan'}>{match.probability}% match</Badge></div>
                <p className="mt-1 text-[10px] text-slate-500">ICD-11: {match.disease.icd11Verified ? match.disease.icd11 : `${match.disease.icd11} · unverified`}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{match.matchedSignals.map((signal) => <Badge key={signal} variant="slate">{signal}</Badge>)}{match.disease.rare && <Badge variant="purple"><Sparkles size={11} className="mr-1" /> Rare signal</Badge>}</div>
                <div className="mt-3 rounded-xl border border-slate-800 bg-[#0b0f19] px-3 py-2 text-xs text-slate-400"><span className="mr-2 text-[9px] font-bold tracking-widest text-cyan-300">CARE NOTE</span>{match.disease.careNote}</div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500"><FileText size={12} /> Open patient education and therapy cautions</div>
              </div>
            </div></Card>
          </button>)}
        </div> : <Card className="grid min-h-64 place-items-center text-center"><div><Activity className="mx-auto h-8 w-8 text-slate-600" /><h3 className="mt-3 font-semibold text-slate-300">No matching signals yet</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Enter symptoms or load a clinical preset. No match does not exclude disease.</p></div></Card>}
        <Card className="border-amber-400/20 bg-amber-400/[0.04]"><div className="flex gap-3 text-xs leading-5 text-amber-100/80"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p><strong className="text-amber-200">Clinical safety notice.</strong> This prototype is not a medical device or clinical guideline. Verify diagnoses, ICD-11 coding, allergies, doses, and treatment with qualified clinicians and current local protocols. For emergencies, activate local emergency care.</p></div></Card>
      </section>
    </div>
  );
}
