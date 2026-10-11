export type TabId = 'diagnosis' | 'antibiotic' | 'database' | 'history';
export type AllergyKey = 'penicillin' | 'sulfa' | 'macrolide';
export type PatientGender = 'female' | 'male' | 'intersex' | 'unknown' | '';
export type PrescriptionStatus = 'Not signed' | 'Demo signature confirmed';

export interface PatientState {
  rawName: string;
  hashedId: string;
  age: string;
  gender: PatientGender;
  egfr: number;
  allergies: AllergyKey[];
  symptomsRaw: string;
}

export interface AntibioticGuideline {
  id: string;
  name: string;
  className: string;
  status: 'First-line example' | 'Alternative example' | 'Specialist therapy';
  allergyRisks: AllergyKey[];
  contraindications: AllergyKey[];
  baseDose: string;
  renalDoseBelow30?: string;
  dosage: string;
  egfrAdjustments: Array<{ below: number; guidance: string }>;
  note: string;
}

export interface DiseaseRecord {
  id: string;
  name: string;
  category: string;
  icd11: string;
  icd11Code: string;
  icd11Verified: boolean;
  keywords: string[];
  symptoms: string[];
  symptomSignals: string[];
  summary: string;
  homeCare: string[];
  redFlags: string[];
  careNote: string;
  rare: boolean;
  therapies: AntibioticGuideline[];
  recommendedAntibiotics: AntibioticGuideline[];
}

export interface MatchResult {
  disease: DiseaseRecord;
  probability: number;
  matchedSignals: string[];
  explanation: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  patientHashId: string;
  diagnoses: Array<{ name: string; probability: number; icd11: string }>;
  prescribedAntibiotic: string | null;
  signatureStatus: PrescriptionStatus;
}

export type TherapyOption = AntibioticGuideline;
export type Disease = DiseaseRecord;
export type DiagnosisMatch = MatchResult;
export type AssessmentHistoryEntry = AuditLogEntry;

export type PatientDraft = PatientState;

export interface UserPreferences {
  egfr: number;
  allergies: AllergyKey[];
  patientId: string;
  history: AssessmentHistoryEntry[];
}
