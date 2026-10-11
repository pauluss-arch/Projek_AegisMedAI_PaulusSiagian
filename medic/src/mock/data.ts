import { Patient, DiagnosisResult, RareDisease, AntibioticRecommendation } from '../types';

export const mockPatients: Patient[] = [
  {
    id: 'P-101',
    name: 'Siti Rahma',
    age: 45,
    gender: 'female',
    allergies: ['Penicillin'],
    eGFR: 62,
    liverFunction: 'Normal',
  },
  {
    id: 'P-102',
    name: 'Budi Santoso',
    age: 58,
    gender: 'male',
    allergies: [],
    eGFR: 28,
    liverFunction: 'Mild Impairment',
  },
  {
    id: 'P-103',
    name: 'Ahmad Putra',
    age: 29,
    gender: 'male',
    allergies: ['Sulfa'],
    eGFR: 90,
    liverFunction: 'Normal',
  },
];

export const mockDiagnoses: DiagnosisResult[] = [
  {
    id: 'D-01',
    diseaseName: 'Community-Acquired Pneumonia',
    icdCode: 'J18.9',
    probability: 88,
    isRareDisease: false,
    description: 'Acute lung infection causing fever, cough with purulent sputum, and dyspnea.',
    recommendedAntibiotic: 'Azithromycin 500mg IV/Oral',
  },
  {
    id: 'D-02',
    diseaseName: 'Melioidosis (Burkholderia pseudomallei)',
    icdCode: 'A24.1',
    probability: 14,
    isRareDisease: true,
    description: 'Rare tropical infection mimicking tuberculosis or severe bacterial pneumonia.',
    recommendedAntibiotic: 'Ceftazidime IV',
  },
  {
    id: 'D-03',
    diseaseName: 'Acute Pyelonephritis',
    icdCode: 'N10',
    probability: 8,
    isRareDisease: false,
    description: 'Bacterial infection of the upper urinary tract and renal parenchyma causing flank pain and fever.',
    recommendedAntibiotic: 'Ciprofloxacin 500mg',
  },
];

export const mockAntibioticGuidelines: AntibioticRecommendation[] = [
  {
    drugName: 'Azithromycin',
    dosage: '500mg',
    frequency: 'Once Daily (Q24H)',
    durationDays: 5,
    safetyWarnings: [
      'Monitor ECG for QT prolongation if co-administered with antiarrhythmics.',
      'Safe in penicillin-allergic patients (Macrolide class).',
    ],
  },
  {
    drugName: 'Amoxicillin / Clavulanate (Augmentin)',
    dosage: '625mg to 1000mg',
    frequency: 'Every 8 to 12 Hours (Q8H/Q12H)',
    durationDays: 7,
    safetyWarnings: [
      'CONTRAINDICATED in documented Penicillin allergy.',
      'Caution in severe hepatic impairment (risk of cholestatic jaundice).',
      'Reduce dose if eGFR < 30 mL/min/1.73m².',
    ],
  },
  {
    drugName: 'Ciprofloxacin',
    dosage: '250mg to 500mg',
    frequency: 'Twice Daily (Q12H)',
    durationDays: 7,
    safetyWarnings: [
      'Reduce dose by 50% if eGFR < 30 mL/min/1.73m².',
      'Black Box Warning: Risk of tendonitis, tendon rupture, and peripheral neuropathy.',
    ],
  },
  {
    drugName: 'Ceftazidime',
    dosage: '1g to 2g',
    frequency: 'Every 8 Hours (Q8H)',
    durationDays: 14,
    safetyWarnings: [
      'Reduce dose and extend interval if eGFR < 50 mL/min/1.73m².',
      'Caution in severe IgE-mediated penicillin anaphylaxis (cross-reactivity risk).',
    ],
  },
];

export const mockRareDiseases: RareDisease[] = [
  {
    id: 'RD-01',
    name: 'Melioidosis',
    icd11Code: '1B90',
    category: 'Infectious Disease',
    prevalence: '1-9 / 100,000',
    keySymptoms: ['Prolonged fever', 'Abscess formation', 'Cough', 'Chest pain'],
    description: 'An infectious disease caused by the Gram-negative bacterium Burkholderia pseudomallei found in soil and water.',
    treatmentSummary: 'Initial intensive phase with Ceftazidime IV for 2 weeks, followed by oral Co-trimoxazole eradication therapy.',
  },
  {
    id: 'RD-02',
    name: 'Fabry Disease',
    icd11Code: '5C56.1',
    category: 'Metabolic Disorder',
    prevalence: '1 / 40,000',
    keySymptoms: ['Acroparesthesias', 'Angiokeratomas', 'Hypohidrosis', 'Renal impairment'],
    description: 'X-linked lysosomal storage disorder caused by deficiency of alpha-galactosidase A.',
    treatmentSummary: 'Enzyme replacement therapy (Agalsidase beta) and chaperone therapy.',
  },
  {
    id: 'RD-03',
    name: 'Granulomatosis with Polyangiitis',
    icd11Code: '4A44.0',
    category: 'Autoimmune',
    prevalence: '3 / 100,000',
    keySymptoms: ['Chronic sinusitis', 'Hemoptysis', 'Glomerulonephritis', 'Saddle nose deformity'],
    description: 'Systemic vasculitis affecting small to medium-sized blood vessels, predominantly involving respiratory tract and kidneys.',
    treatmentSummary: 'Corticosteroids combined with Rituximab or Cyclophosphamide.',
  },
];