'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, FileDown, LockKeyhole, ShieldAlert } from 'lucide-react';
import { Navbar } from './components/Layout/Navbar';
import { Badge } from './components/UI/Badge';
import { Button } from './components/UI/Button';
import { Card } from './components/UI/Card';
import { Modal } from './components/UI/Modal';
import { AntibioticChecker } from './features/AntibioticChecker';
import { AuditHistory } from './features/AuditHistory';
import { PatientDiagnosis } from './features/PatientDiagnosis';
import { RareExplorer } from './features/RareExplorer';
import {
  createPatientAction,
  deletePatientAction,
  signDiagnosisAction,
  updatePatientAction,
} from '../app/actions/patientActions';
import type { AllergyKey, AssessmentHistoryEntry, DiagnosisMatch, Disease, PatientState, PersistedPatient, TabId, TherapyOption } from './types';
import { STORAGE_KEY } from './utils/assessmentStorage';
import { matchSymptoms } from './utils/symptomMatcher';

type StoredState = { egfr: number; allergies: AllergyKey[]; patientId: string };
const emptyPatient: PatientState = {
  rawName: '',
  hashedId: '',
  age: '',
  gender: '',
  egfr: 90,
  allergies: [],
  symptomsRaw: '',
};
const presets: Record<string, { text: string; diseaseId: string }> = {
  cap: { text: 'Fever, productive cough with sputum, shortness of breath, and pleuritic chest pain.', diseaseId: 'cap' },
  uti: { text: 'Painful urination, urinary urgency and frequency, burning when passing urine.', diseaseId: 'uti' },
  fabry: { text: 'Burning pain in hands and feet, reduced sweating, angiokeratomas, and a family history of kidney or heart disease.', diseaseId: 'fabry' },
  gbs: { text: 'Progressive weakness ascending from the legs, tingling in both feet, and reduced reflexes after a recent infection.', diseaseId: 'gbs' },
};
const tabContent: Record<TabId, { title: string; description: string }> = {
  diagnosis: {
    title: 'Patient assessment',
    description: 'Explore a structured differential from the clinical picture, with clear reasoning and next steps.',
  },
  antibiotic: {
    title: 'Antibiotic safety',
    description: 'Review antimicrobial considerations alongside allergies and patient-specific safety factors.',
  },
  database: {
    title: 'Rare disease explorer',
    description: 'Explore reference information for uncommon diseases and their associated clinical findings.',
  },
  history: {
    title: 'Audit history',
    description: 'Review patient assessments and linked decision-support records stored in PostgreSQL.',
  },
};

function printReport(disease: Disease, patientId: string, probability: number, egfr: number, signatureStatus: string) {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    window.alert('The report window was blocked. Allow pop-ups for this page and try again.');
    return;
  }
  const documentRef = reportWindow.document;
  documentRef.title = 'AegisMed AI · Clinical summary';
  const style = documentRef.createElement('style');
  style.textContent = 'body{font:14px Arial,sans-serif;color:#15202b;max-width:780px;margin:40px auto;padding:0 24px}h1{color:#087e8b}h2{margin-top:28px;border-bottom:1px solid #ccd5dd;padding-bottom:8px}.meta{color:#506070}.notice{background:#fff4d6;padding:14px;border-left:4px solid #f59e0b}li{margin:8px 0}@media print{body{margin:16mm auto}}';
  documentRef.head.append(style);
  const main = documentRef.createElement('main');
  const heading = documentRef.createElement('h1'); heading.textContent = 'AegisMed AI · Clinical decision-support summary'; main.append(heading);
  const meta = documentRef.createElement('p'); meta.className = 'meta'; meta.textContent = `Pseudonymous patient ID: ${patientId || 'Not assigned'} · Generated: ${new Date().toLocaleString()}`; main.append(meta);
  const notice = documentRef.createElement('p'); notice.className = 'notice'; notice.textContent = 'DEMONSTRATION ONLY — Not a diagnosis, prescription, or substitute for clinical judgment. Verify all information with a qualified clinician and current local protocols.'; main.append(notice);
  const diagnosisHeading = documentRef.createElement('h2'); diagnosisHeading.textContent = 'Differential finding'; main.append(diagnosisHeading);
  const diagnosis = documentRef.createElement('p'); diagnosis.textContent = `${disease.name} · match signal ${probability}% · ICD-11: ${disease.icd11Verified ? disease.icd11 : 'not verified'}`; main.append(diagnosis);
  const renal = documentRef.createElement('p'); renal.textContent = `Entered eGFR: ${egfr} mL/min/1.73m². No dose was calculated or validated by this demonstration.`; main.append(renal);
  const therapyHeading = documentRef.createElement('h2'); therapyHeading.textContent = 'Therapy considerations'; main.append(therapyHeading);
  const list = documentRef.createElement('ul');
  const reportTherapies: TherapyOption[] = disease.therapies.length ? disease.therapies : [{
    id: 'none',
    name: 'No antimicrobial option listed',
    className: 'Not applicable',
    status: 'Specialist therapy',
    allergyRisks: [],
    contraindications: [],
    baseDose: 'No dose recommendation is provided.',
    dosage: 'No dose recommendation is provided.',
    egfrAdjustments: [],
    note: 'Follow clinician-directed care.',
  }];
  reportTherapies.forEach((therapy) => {
    const item = documentRef.createElement('li'); item.textContent = `${therapy.name}: ${therapy.note} ${therapy.baseDose ?? ''}`; list.append(item);
  });
  main.append(list);
  const signature = documentRef.createElement('p'); signature.textContent = `Digital signature status: ${signatureStatus} (demonstration only; no prescription transmitted).`; main.append(signature);
  documentRef.body.replaceChildren(main);
  reportWindow.focus();
  reportWindow.print();
}

function App({ initialPatients, diseases }: { initialPatients: PersistedPatient[]; diseases: Disease[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('diagnosis');
  const [patient, setPatient] = useState<PatientState>(emptyPatient);
  const [patients, setPatients] = useState(initialPatients);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeDiagnosisId, setActiveDiagnosisId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSavingSafety, setIsSavingSafety] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [preferenceError, setPreferenceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [evaluated, setEvaluated] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [selectedProbability, setSelectedProbability] = useState(0);
  const [signatureConfirm, setSignatureConfirm] = useState(false);
  const history = useMemo<AssessmentHistoryEntry[]>(() => patients.map((record) => ({
    id: record.id,
    timestamp: record.diagnoses[0]?.createdAt ?? record.createdAt,
    patientHashId: record.medicalRecordNum,
    diagnoses: record.diagnoses.map((diagnosis) => ({
      name: diagnosis.diseaseName,
      probability: diagnosis.matchPercentage,
      icd11: diagnosis.icdCode,
    })),
    prescribedAntibiotic: record.diagnoses.find((diagnosis) => diagnosis.prescribedDrug)?.prescribedDrug ?? null,
    signatureStatus: record.diagnoses.some((diagnosis) => diagnosis.digitalSignature)
      ? 'Demo signature confirmed'
      : 'Not signed',
  })), [patients]);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    const availableTabs: TabId[] = ['diagnosis', 'antibiotic', 'database', 'history'];
    const initialTab = availableTabs.find((tab) => tab === requestedTab);
    if (initialTab) setActiveTab(initialTab);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<StoredState>;
        setPatient((current) => ({
          ...current,
          egfr: typeof stored.egfr === 'number' && stored.egfr >= 5 && stored.egfr <= 150 ? stored.egfr : current.egfr,
          allergies: Array.isArray(stored.allergies) ? stored.allergies.filter((value): value is AllergyKey => ['penicillin', 'sulfa', 'macrolide'].includes(value)) : current.allergies,
          hashedId: typeof stored.patientId === 'string' && /^PAT-[A-F0-9]{64}$/.test(stored.patientId) ? stored.patientId : current.hashedId,
        }));
      }
    } catch {
      setPreferenceError('Local preferences could not be read. The assessment remains available with database records.');
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ egfr: patient.egfr, allergies: patient.allergies, patientId: patient.hashedId } satisfies StoredState));
      setPreferenceError('');
    } catch {
      setPreferenceError('Local browser storage is unavailable or full. Changes may not persist after this session.');
    }
  }, [patient.egfr, patient.allergies, patient.hashedId, storageReady]);

  const matches = useMemo(() => evaluated ? matchSymptoms(patient.symptomsRaw, diseases) : [], [evaluated, patient.symptomsRaw]);
  const selectedForSafety = selectedDisease ?? matches[0]?.disease;

  const selectDiagnosis = (match: DiagnosisMatch) => {
    setSelectedDisease(match.disease);
    setSelectedProbability(match.probability);
  };
  const openDisease = (disease: Disease) => {
    setSelectedDisease(disease);
    setSelectedProbability(matches.find((match) => match.disease.id === disease.id)?.probability ?? 0);
  };

  const selectedSignatureStatus = selectedDisease && patients
    .find((record) => record.id === activePatientId)
    ?.diagnoses.find((diagnosis) => diagnosis.id === activeDiagnosisId && diagnosis.diseaseName === selectedDisease.name)
    ?.digitalSignature
    ? 'Demo signature confirmed'
    : 'Not signed';

  const runEvaluation = async (symptoms: string, rawName: string) => {
    setFieldErrors({});
    setStorageError('');
    setStatusMessage('');
    setIsEvaluating(true);
    try {
      const result = matchSymptoms(symptoms, diseases);
      const topMatch = result[0];
      const saved = await createPatientAction({
        name: rawName,
        age: Number(patient.age),
        gender: patient.gender || 'unknown',
        eGFR: patient.egfr,
        hasPenicillinAlg: patient.allergies.includes('penicillin'),
        diseaseName: topMatch?.disease.name ?? 'Unclassified symptoms',
        icdCode: topMatch
          ? topMatch.disease.icd11Verified ? topMatch.disease.icd11 : `${topMatch.disease.icd11} · unverified`
          : 'UNCLASSIFIED',
        matchPercentage: topMatch?.probability ?? 0,
        isRareDisease: topMatch?.disease.rare ?? false,
        symptoms,
        prescribedDrug: null,
      });
      if (!saved.success) {
        setFieldErrors(saved.fieldErrors ?? {});
        setStorageError(saved.message);
        return;
      }

      setPatients((previous) => [saved.patient, ...previous.filter((item) => item.id !== saved.patient.id)]);
      setActivePatientId(saved.patient.id);
      setActiveDiagnosisId(saved.patient.diagnoses[0]?.id ?? null);
      setPatient((current) => ({ ...current, rawName: '', hashedId: saved.patient.name, symptomsRaw: symptoms }));
      setEvaluated(true);
      if (result.length) {
        setSelectedDisease(result[0].disease);
        setSelectedProbability(result[0].probability);
      } else {
        setSelectedDisease(null);
        setSelectedProbability(0);
      }
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Assessment could not be saved.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluate = () => void runEvaluation(patient.symptomsRaw, patient.rawName);

  const loadPreset = (key: string) => {
    const preset = presets[key];
    if (!preset) return;
    setPatient((current) => ({ ...current, symptomsRaw: preset.text }));
    setEvaluated(false);
    setFieldErrors({});
    setStorageError('');
  };

  const saveSafetyContext = async () => {
    setStatusMessage('');
    if (!activePatientId) {
      setStorageError('Run and save an assessment before persisting its safety context.');
      return;
    }
    setIsSavingSafety(true);
    try {
      const saved = await updatePatientAction({
        id: activePatientId,
        eGFR: patient.egfr,
        hasPenicillinAlg: patient.allergies.includes('penicillin'),
      });
      if (!saved.success) {
        setStorageError(saved.message);
        return;
      }
      setPatients((previous) => previous.map((item) => item.id === saved.patient.id ? saved.patient : item));
      setStorageError('');
      setStatusMessage('Safety context saved to PostgreSQL.');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Safety context could not be saved.');
    } finally {
      setIsSavingSafety(false);
    }
  };

  const removePatient = async (id: string) => {
    if (!window.confirm('Delete this patient record and all linked diagnoses? This cannot be undone.')) return;
    setStatusMessage('');
    try {
      const result = await deletePatientAction(id);
      if (!result.success) {
        setStorageError(result.message);
        return;
      }
      setPatients((previous) => previous.filter((item) => item.id !== id));
      if (activePatientId === id) {
        setActivePatientId(null);
        setActiveDiagnosisId(null);
      }
      setStorageError('');
      setStatusMessage('Patient record and linked diagnoses deleted.');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Patient record could not be deleted.');
    }
  };

  const signDemo = async () => {
    setStatusMessage('');
    if (!selectedDisease || !activeDiagnosisId || !activePatientId) {
      setStorageError('Save an assessment before recording a demo signature.');
      return;
    }
    try {
      const result = await signDiagnosisAction({
        diagnosisId: activeDiagnosisId,
        diseaseName: selectedDisease.name,
        icdCode: selectedDisease.icd11Verified ? selectedDisease.icd11 : `${selectedDisease.icd11} · unverified`,
        matchPercentage: selectedProbability,
        isRareDisease: selectedDisease.rare,
        prescribedDrug: null,
      });
      if (!result.success) {
        setStorageError(result.message);
        return;
      }
      setPatients((previous) => previous.map((item) => item.id !== result.patientId ? item : {
        ...item,
        diagnoses: item.diagnoses.map((diagnosis) => diagnosis.id === result.diagnosis.id ? result.diagnosis : diagnosis),
      }));
      setStorageError('');
      setStatusMessage('Demo signature recorded in PostgreSQL.');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Demo signature could not be recorded.');
      return;
    }
    setSignatureConfirm(false);
  };

  const exportCurrent = () => {
    if (!selectedDisease) {
      window.alert('Run an assessment and select a finding before exporting a report.');
      return;
    }
    printReport(selectedDisease, patient.hashedId, selectedProbability, patient.egfr, selectedSignatureStatus);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <Navbar activeTab={activeTab} onChange={setActiveTab} onPrint={exportCurrent} />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <section aria-labelledby="page-title" className="flex flex-wrap items-end justify-between gap-4 py-2">
          <div>
            <Badge variant="cyan"><Activity size={11} className="mr-1" /> Clinical intelligence workspace</Badge>
            <h1 id="page-title" className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{tabContent[activeTab].title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{tabContent[activeTab].description}</p>
          </div>
          <Badge variant="purple"><LockKeyhole size={12} className="mr-1" /> Server-side pseudonymization · No external AI calls</Badge>
        </section>
        <section role="note" className="flex gap-3 rounded-xl border border-purple-400/20 bg-purple-400/[0.04] p-4 text-xs leading-5 text-purple-100/80">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" /><p><strong className="text-purple-200">Privacy and security demonstration.</strong> Patient names are converted to keyed HMAC-SHA-256 pseudonyms before storage; the submitted name is not saved. Pseudonymization is not encryption, and this prototype is not certified for HIPAA/PDP compliance. Use synthetic data only.</p>
        </section>
        {storageError && <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200"><ShieldAlert className="mr-2 inline h-4 w-4" />{storageError}</div>}
        {preferenceError && <div role="alert" className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200"><ShieldAlert className="mr-2 inline h-4 w-4" />{preferenceError}</div>}
        {statusMessage && <p role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200">{statusMessage}</p>}
        {activeTab === 'diagnosis' && <PatientDiagnosis patient={patient} setPatient={setPatient} matches={matches} onEvaluate={evaluate} onSelect={selectDiagnosis} onPreset={loadPreset} hasEvaluated={evaluated} fieldErrors={fieldErrors} isEvaluating={isEvaluating} isSavingSafety={isSavingSafety} onSaveSafetyContext={saveSafetyContext} />}
        {activeTab === 'antibiotic' && <AntibioticChecker disease={selectedForSafety} patient={patient} onPatientChange={setPatient} onSaveSafetyContext={saveSafetyContext} isSavingSafety={isSavingSafety} />}
        {activeTab === 'database' && <RareExplorer diseases={diseases} onSelect={openDisease} />}
        {activeTab === 'history' && <AuditHistory entries={history} onDelete={removePatient} />}
        <footer className="border-t border-slate-800 pt-4 text-[10px] leading-5 text-slate-600"><Activity className="mr-1 inline h-3 w-3" />AegisMed AI is a software demonstration. It does not provide medical advice, diagnose disease, transmit prescriptions, or establish regulatory compliance. Codes and therapies require independent verification.</footer>
      </main>

      {selectedDisease && !signatureConfirm && (activeTab === 'diagnosis' || activeTab === 'database') && (
        <Modal isOpen={true} onClose={() => setSelectedDisease(null)} title={selectedDisease.name}>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2"><Badge variant={selectedDisease.rare ? 'purple' : 'cyan'}>{selectedDisease.category}</Badge><Badge variant="slate">ICD-11: {selectedDisease.icd11Verified ? selectedDisease.icd11 : 'verification required'}</Badge>{selectedProbability > 0 && <Badge variant="green">{selectedProbability}% signal match</Badge>}</div>
            <Card title="What this may mean" subtitle="Patient-friendly educational information"><p className="text-sm leading-6 text-slate-300">{selectedDisease.summary}</p></Card>
            <Card title="Home care" ><ul className="list-disc space-y-2 pl-5 text-xs leading-5 text-slate-300">{selectedDisease.homeCare.map((item) => <li key={item}>{item}</li>)}</ul></Card>
            <Card title="Seek urgent medical help for"><ul className="list-disc space-y-2 pl-5 text-xs leading-5 text-rose-200">{selectedDisease.redFlags.map((item) => <li key={item}>{item}</li>)}</ul></Card>
            <Card title="Therapy information" subtitle="Examples only; no prescription is generated"><p className="mb-3 text-xs leading-5 text-slate-400">{selectedDisease.careNote}</p>{selectedDisease.therapies.length ? <div className="space-y-3">{selectedDisease.therapies.map((therapy) => {
              const conflicts = therapy.contraindications.filter((allergy) => patient.allergies.includes(allergy));
              return <article key={therapy.id} className="rounded-xl border border-slate-800 bg-[#0b0f19] p-3"><div className="flex flex-wrap justify-between gap-2"><h4 className="text-xs font-semibold text-white">{therapy.name}</h4><Badge variant={conflicts.length ? 'danger' : 'cyan'}>{conflicts.length ? 'Potential allergy conflict' : therapy.status}</Badge></div><p className="mt-2 text-[10px] leading-5 text-slate-400">{therapy.note}</p><p className="mt-1 text-[10px] text-slate-500">{therapy.baseDose} {patient.egfr < 30 ? therapy.renalDoseBelow30 : ''}</p></article>;
            })}</div> : <p className="text-xs text-slate-400">No antibiotic therapy is listed for this condition.</p>}</Card>
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" onClick={() => printReport(selectedDisease, patient.hashedId, selectedProbability, patient.egfr, selectedSignatureStatus)}><FileDown size={14} /> Print / export</Button><Button type="button" variant="primary" onClick={() => setSignatureConfirm(true)}>Record demo signature</Button></div>
            <p className="text-[10px] leading-4 text-slate-500">Digital signing is simulated only. No prescription is transmitted, and a qualified prescriber must independently determine care.</p>
          </div>
        </Modal>
      )}
      {signatureConfirm && selectedDisease && <Modal isOpen={true} onClose={() => setSignatureConfirm(false)} title="Confirm demo signature" ><div className="space-y-4"><p className="text-sm leading-6 text-slate-300">This action records a keyed integrity marker in the database for demonstration only. It does not create or transmit a legal prescription.</p><div className="flex justify-end gap-2"><Button type="button" onClick={() => setSignatureConfirm(false)}>Cancel</Button><Button type="button" variant="primary" onClick={() => void signDemo()}>Confirm demo signature</Button></div></div></Modal>}
      <span className="sr-only">eGFR safety setting currently {patient.egfr}. Patient name is never sent to an external AI engine.</span>
    </div>
  );
}

export default App;
