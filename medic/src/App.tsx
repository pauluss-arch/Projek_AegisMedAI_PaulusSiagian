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
  recordDiagnosisAction,
  signDiagnosisAction,
  updatePatientAction,
} from '../app/actions/patientActions';
import type { AssessmentHistoryEntry, DiagnosisMatch, Disease, PatientState, PersistedPatient, TabId, TherapyOption } from './types';
import { HISTORY_LIMIT } from './utils/assessmentStorage';
import { matchSymptoms } from './utils/symptomMatcher';

const emptyPatient: PatientState = {
  rawName: '',
  hashedId: '',
  patientId: '',
  medicalRecordNum: '',
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
    title: 'Disease reference library',
    description: 'Explore disease reference entries and their associated clinical findings.',
  },
  history: {
    title: 'Audit history',
    description: 'Review persisted patient assessments and their recorded decision-support signals.',
  },
};

function historyFromPatients(patients: PersistedPatient[]): AssessmentHistoryEntry[] {
  return patients
    .flatMap((patient) => patient.diagnoses.map((diagnosis) => ({
      id: diagnosis.id,
      timestamp: diagnosis.createdAt,
      patientHashId: patient.medicalRecordNum,
      diagnoses: [{
        name: diagnosis.diseaseName,
        probability: diagnosis.matchPercentage,
        icd11: diagnosis.icdCode,
      }],
      prescribedAntibiotic: diagnosis.prescribedDrug,
      signatureStatus: diagnosis.digitalSignature ? 'Demo signature confirmed' as const : 'Not signed' as const,
    })))
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function generateMedicalRecordNum(): string {
  const value = crypto.getRandomValues(new Uint16Array(1))[0] ?? 0;
  return `RM-${new Date().getFullYear()}-${String(value % 10000).padStart(4, '0')}`;
}

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

function App({ initialPatients, initialDiseases }: { initialPatients: PersistedPatient[]; initialDiseases: Disease[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('diagnosis');
  const [patient, setPatient] = useState<PatientState>(emptyPatient);
  const [savedPatients, setSavedPatients] = useState(initialPatients);
  const [history, setHistory] = useState<AssessmentHistoryEntry[]>(() => historyFromPatients(initialPatients));
  const [storageError, setStorageError] = useState('');
  const [patientFieldErrors, setPatientFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [patientSaveError, setPatientSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [selectedProbability, setSelectedProbability] = useState(0);
  const [signatureConfirm, setSignatureConfirm] = useState(false);

  useEffect(() => {
    setPatient((current) => current.medicalRecordNum ? current : {
      ...current,
      medicalRecordNum: generateMedicalRecordNum(),
    });
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    const availableTabs: TabId[] = ['diagnosis', 'antibiotic', 'database', 'history'];
    const initialTab = availableTabs.find((tab) => tab === requestedTab);
    if (initialTab) setActiveTab(initialTab);
  }, []);

  const hasPenicillinAlg = patient.allergies.includes('penicillin');
  useEffect(() => {
    if (!patient.patientId) return;
    const timer = window.setTimeout(() => {
      void updatePatientAction({
        id: patient.patientId,
        eGFR: patient.egfr,
        hasPenicillinAlg,
      }).then((result) => {
        if (!result.success) {
          setStorageError(result.message);
          return;
        }
        setSavedPatients((current) => current.map((item) => item.id === result.patient.id ? result.patient : item));
        setStorageError('');
      }).catch((error: unknown) => {
        setStorageError(error instanceof Error ? error.message : 'Patient safety details could not be saved.');
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [patient.patientId, patient.egfr, hasPenicillinAlg]);

  const matches = useMemo(() => evaluated ? matchSymptoms(patient.symptomsRaw, initialDiseases) : [], [evaluated, patient.symptomsRaw, initialDiseases]);
  const selectedForSafety = selectedDisease ?? matches[0]?.disease;

  const selectDiagnosis = (match: DiagnosisMatch) => {
    setSelectedDisease(match.disease);
    setSelectedProbability(match.probability);
  };
  const openDisease = (disease: Disease) => {
    setSelectedDisease(disease);
    setSelectedProbability(matches.find((match) => match.disease.id === disease.id)?.probability ?? 0);
  };

  const runEvaluation = async (symptoms: string) => {
    if (!symptoms.trim()) return;
    setPatientSaveError('');
    setPatientFieldErrors({});
    setIsSaving(true);
    try {
      const matchesForSymptoms = matchSymptoms(symptoms, initialDiseases);
      const bestMatch = matchesForSymptoms[0];
      const diagnosis = {
        diseaseName: bestMatch?.disease.name ?? 'No matching signal',
        icdCode: bestMatch?.disease.icd11 ?? 'UNVERIFIED',
        matchPercentage: bestMatch?.probability ?? 0,
        isRareDisease: bestMatch?.disease.rare ?? false,
        symptoms,
        prescribedDrug: null,
      };
      const result = patient.patientId
        ? await recordDiagnosisAction({
          patientId: patient.patientId,
          eGFR: patient.egfr,
          hasPenicillinAlg,
          ...diagnosis,
        })
        : await createPatientAction({
          medicalRecordNum: patient.medicalRecordNum,
          name: patient.rawName,
          age: Number(patient.age),
          gender: patient.gender || 'unknown',
          eGFR: patient.egfr,
          hasPenicillinAlg,
          ...diagnosis,
        });

      if (!result.success) {
        setPatientFieldErrors(result.fieldErrors ?? {});
        setPatientSaveError(result.message);
        return;
      }

      const savedPatient = result.patient;
      const savedDiagnosis = savedPatient.diagnoses[0];
      if (!savedDiagnosis) {
        throw new Error('The saved patient has no linked diagnosis record.');
      }

      setSavedPatients((current) => [
        savedPatient,
        ...current.filter((item) => item.id !== savedPatient.id),
      ]);
      setPatient((current) => ({
        ...current,
        rawName: '',
        hashedId: savedPatient.name,
        patientId: savedPatient.id,
        medicalRecordNum: savedPatient.medicalRecordNum,
        symptomsRaw: symptoms,
      }));
      setPatientSaveError('');
      setStorageError('');
      setEvaluated(true);
      const entry: AssessmentHistoryEntry = {
        id: savedDiagnosis.id,
        timestamp: savedDiagnosis.createdAt,
        patientHashId: savedPatient.medicalRecordNum,
        diagnoses: [{
          name: savedDiagnosis.diseaseName,
          probability: savedDiagnosis.matchPercentage,
          icd11: savedDiagnosis.icdCode,
        }],
        prescribedAntibiotic: savedDiagnosis.prescribedDrug,
        signatureStatus: savedDiagnosis.digitalSignature ? 'Demo signature confirmed' : 'Not signed',
      };
      setHistory((previous) => [entry, ...previous.filter((item) => item.id !== entry.id)].slice(0, HISTORY_LIMIT));
      if (bestMatch) {
        setSelectedDisease(bestMatch.disease);
        setSelectedProbability(bestMatch.probability);
      } else {
        setSelectedDisease(null);
        setSelectedProbability(0);
      }
    } catch (error) {
      setPatientSaveError(error instanceof Error ? error.message : 'Patient assessment could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const evaluate = () => void runEvaluation(patient.symptomsRaw);

  const loadPreset = (key: string) => {
    const preset = presets[key];
    if (!preset) return;
    const disease = initialDiseases.find((item) => item.id === preset.diseaseId);
    setPatient((current) => ({ ...current, symptomsRaw: preset.text }));
    setEvaluated(false);
    if (disease) {
      setSelectedDisease(disease);
      setSelectedProbability(matchSymptoms(preset.text, initialDiseases).find((item) => item.disease.id === disease.id)?.probability ?? 0);
    }
  };

  const selectSavedPatient = (savedPatient: PersistedPatient) => {
    setPatient({
      ...emptyPatient,
      rawName: '',
      hashedId: savedPatient.name,
      patientId: savedPatient.id,
      medicalRecordNum: savedPatient.medicalRecordNum,
      age: String(savedPatient.age),
      gender: savedPatient.gender,
      egfr: savedPatient.eGFR,
      allergies: savedPatient.hasPenicillinAlg ? ['penicillin'] : [],
    });
    setPatientFieldErrors({});
    setPatientSaveError('');
    setEvaluated(false);
    setSelectedDisease(null);
    setSelectedProbability(0);
    setActiveTab('diagnosis');
  };

  const startNewPatient = () => {
    setPatient({ ...emptyPatient, medicalRecordNum: generateMedicalRecordNum() });
    setPatientFieldErrors({});
    setPatientSaveError('');
    setEvaluated(false);
    setSelectedDisease(null);
    setSelectedProbability(0);
  };

  const removeSavedPatient = async (savedPatient: PersistedPatient) => {
    if (!window.confirm(`Delete ${savedPatient.medicalRecordNum} and all of its diagnosis records? This cannot be undone.`)) return;
    try {
      const result = await deletePatientAction(savedPatient.id);
      if (!result.success) {
        setStorageError(result.message ?? 'Patient record could not be deleted.');
        return;
      }
      setSavedPatients((current) => current.filter((item) => item.id !== savedPatient.id));
      const deletedDiagnosisIds = new Set(savedPatient.diagnoses.map((diagnosis) => diagnosis.id));
      setHistory((current) => current.filter((entry) => !deletedDiagnosisIds.has(entry.id)));
      if (patient.patientId === savedPatient.id) {
        setPatient({ ...emptyPatient, medicalRecordNum: generateMedicalRecordNum() });
        setEvaluated(false);
        setSelectedDisease(null);
        setSelectedProbability(0);
      }
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Patient record could not be deleted.');
    }
  };

  const signDemo = async () => {
    if (!selectedDisease) return;
    const currentAssessment = history.find((entry) => entry.patientHashId === patient.medicalRecordNum);
    if (!patient.patientId || !currentAssessment) {
      setSignatureError('Save an assessment for the selected patient before confirming a signature demonstration.');
      return;
    }

    setIsSigning(true);
    setSignatureError('');
    try {
      const result = await signDiagnosisAction({
        diagnosisId: currentAssessment.id,
        diseaseName: selectedDisease.name,
        icdCode: selectedDisease.icd11,
        matchPercentage: selectedProbability,
        isRareDisease: selectedDisease.rare,
        prescribedDrug: selectedDisease.therapies[0]?.name ?? null,
      });
      if (!result.success) {
        setSignatureError(result.message);
        return;
      }

      setHistory((previous) => previous.map((entry) => entry.id === result.diagnosis.id ? {
        ...entry,
        diagnoses: [{
          name: result.diagnosis.diseaseName,
          probability: result.diagnosis.matchPercentage,
          icd11: result.diagnosis.icdCode,
        }],
        prescribedAntibiotic: result.diagnosis.prescribedDrug,
        signatureStatus: 'Demo signature confirmed',
      } : entry));
      setSavedPatients((previous) => previous.map((savedPatient) => savedPatient.id === patient.patientId ? {
        ...savedPatient,
        diagnoses: savedPatient.diagnoses.map((diagnosis) => diagnosis.id === result.diagnosis.id ? result.diagnosis : diagnosis),
      } : savedPatient));
      setSignatureConfirm(false);
    } catch (error) {
      setSignatureError(error instanceof Error ? error.message : 'The signature demonstration could not be saved.');
    } finally {
      setIsSigning(false);
    }
  };

  const currentPatientHistory = history.find((entry) => entry.patientHashId === patient.medicalRecordNum);
  const exportCurrent = () => {
    if (!selectedDisease) {
      window.alert('Run an assessment and select a finding before exporting a report.');
      return;
    }
    printReport(selectedDisease, patient.hashedId, selectedProbability, patient.egfr, currentPatientHistory?.signatureStatus ?? 'Not signed');
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
          <Badge variant="purple"><LockKeyhole size={12} className="mr-1" /> Server pseudonymization · No external AI calls</Badge>
        </section>
        <section role="note" className="flex gap-3 rounded-xl border border-purple-400/20 bg-purple-400/[0.04] p-4 text-xs leading-5 text-purple-100/80">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" /><p><strong className="text-purple-200">Privacy and security demonstration.</strong> The server stores a keyed SHA-256 pseudonym instead of the entered name. Medical record numbers and symptoms are still sensitive data stored in PostgreSQL. This prototype is not certified for HIPAA/PDP compliance and must not be used with real patient data.</p>
        </section>
        {storageError && <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200"><ShieldAlert className="mr-2 inline h-4 w-4" />{storageError}</div>}
        {activeTab === 'diagnosis' && <PatientDiagnosis patient={patient} setPatient={setPatient} matches={matches} onEvaluate={evaluate} onSelect={selectDiagnosis} onPreset={loadPreset} savedPatients={savedPatients} fieldErrors={patientFieldErrors} saveError={patientSaveError} isSaving={isSaving} onSelectPatient={selectSavedPatient} onDeletePatient={(savedPatient) => void removeSavedPatient(savedPatient)} onNewPatient={startNewPatient} hasEvaluated={evaluated} />}
        {activeTab === 'antibiotic' && <AntibioticChecker disease={selectedForSafety} patient={patient} onPatientChange={setPatient} />}
        {activeTab === 'database' && <RareExplorer diseases={initialDiseases} onSelect={openDisease} />}
        {activeTab === 'history' && <AuditHistory entries={history} />}
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
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" onClick={() => printReport(selectedDisease, patient.hashedId, selectedProbability, patient.egfr, currentPatientHistory?.signatureStatus ?? 'Not signed')}><FileDown size={14} /> Print / export</Button><Button type="button" variant="primary" onClick={() => { setSignatureError(''); setSignatureConfirm(true); }}>Select & sign demo prescription</Button></div>
            <p className="text-[10px] leading-4 text-slate-500">Digital signing is simulated only. No prescription is transmitted, and a qualified prescriber must independently determine care.</p>
          </div>
        </Modal>
      )}
      {signatureConfirm && selectedDisease && <Modal isOpen={true} onClose={() => { if (!isSigning) setSignatureConfirm(false); }} title="Confirm demo signature" ><div className="space-y-4"><p className="text-sm leading-6 text-slate-300">This saves a demo HMAC-SHA-256 signature for the selected assessment. It is not a legal prescription or a clinician identity signature.</p>{signatureError && <p role="alert" className="text-sm text-rose-200">{signatureError}</p>}<div className="flex justify-end gap-2"><Button type="button" disabled={isSigning} onClick={() => setSignatureConfirm(false)}>Cancel</Button><Button type="button" variant="primary" isLoading={isSigning} loadingText="Saving signature…" onClick={() => void signDemo()}>Confirm demo signature</Button></div></div></Modal>}
      <span className="sr-only">eGFR safety setting currently {patient.egfr}. Patient name is never sent to an external AI engine.</span>
    </div>
  );
}

export default App;
