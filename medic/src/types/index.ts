// AegisMed AI - TypeScript Interfaces
// Milestone 1: Clinical Decision Support System (CDSS)

export type Gender = 'male' | 'female' | 'other';

export type LiverFunctionStatus = 
  | 'Normal' 
  | 'Mild Impairment' 
  | 'Moderate Impairment' 
  | 'Severe Impairment';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  allergies: string[];
  eGFR: number; // in mL/min/1.73m²
  liverFunction: LiverFunctionStatus;
}

export interface DiagnosisResult {
  id: string;
  diseaseName: string;
  icdCode: string;
  probability: number; // 0 - 100 percentage
  isRareDisease: boolean;
  description: string;
  recommendedAntibiotic?: string;
}

export interface AntibioticRecommendation {
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  safetyWarnings: string[];
}

export interface RareDisease {
  id: string;
  name: string;
  icd11Code: string;
  category: string;
  prevalence: string;
  keySymptoms: string[];
  description: string;
  treatmentSummary: string;
}