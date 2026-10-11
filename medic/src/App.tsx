import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Droplets,
  FileHeart,
  HeartPulse,
  Info,
  LockKeyhole,
  Microscope,
  Pill,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';

type TabId = 'diagnosis' | 'antibiotic' | 'database';

type RareDisease = {
  id: string;
  name: string;
  category: string;
  icd11: string;
  prevalence: string;
  description: string;
  symptoms: string[];
  treatment: string;
  detectionSignals?: string[];
  icd10?: string;
  rationale?: string;
  antibioticNote?: string;
};

type Differential = {
  name: string;
  icd10: string;
  baseProbability: number;
  keywords: string[];
  isRare?: boolean;
  antibiotic: string;
  rationale: string;
};

type AllergyKey = 'penicillin' | 'sulfa' | 'macrolide';

type InfectionId = 'pneumonia' | 'pyelonephritis' | 'melioidosis' | 'intra-abdominal' | 'sinusitis';

type AntibioticOption = {
  id: string;
  name: string;
  drugClass: string;
  route: string;
  rank: 'First-line choice' | 'Alternative';
  allergyRisks: AllergyKey[];
  requiresLftMonitoring?: boolean;
  dose: (egfr: number) => { text: string; adjusted: boolean; suitable?: boolean };
  note: string;
};

type Infection = {
  id: InfectionId;
  label: string;
  description: string;
  antibiotics: AntibioticOption[];
};

type PatientEducation = {
  title: string;
  summary: string;
  body: string;
  antibiotic: string;
  homeCare: string[];
  redFlags: string[];
};

const educationByCondition: Record<InfectionId | 'general', PatientEducation> = {
  pneumonia: {
    title: 'Pneumonia',
    summary: 'A lung infection that can make breathing uncomfortable and cause a cough or fever.',
    body: 'The tiny air sacs in your lungs can become irritated and fill with fluid. This can cause cough, fever, chest discomfort, and shortness of breath. Germs such as bacteria or viruses can cause pneumonia.',
    antibiotic: 'When a clinician believes bacteria are causing the infection, an antibiotic may help treat those bacteria. Take it exactly as prescribed and finish the prescribed course unless your care team tells you to stop. Antibiotics do not treat viruses.',
    homeCare: ['Rest and drink fluids unless your care team has limited your fluids.', 'Take medicines only as directed and keep follow-up appointments.', 'Avoid smoking and ask your clinician when it is safe to return to usual activities.'],
    redFlags: ['Seek urgent help for severe or worsening trouble breathing, blue lips, new confusion, or fainting.', 'Contact your care team for persistent high fever, inability to keep fluids down, or symptoms that are getting worse.'],
  },
  pyelonephritis: {
    title: 'Kidney infection',
    summary: 'An infection that has reached one or both kidneys, often starting in the urinary tract.',
    body: 'Germs can travel from the bladder up to a kidney. This may cause fever, chills, pain in the back or side, nausea, or painful urination.',
    antibiotic: 'If bacteria are causing the infection, the prescribed antibiotic is intended to kill those bacteria. Take each dose as directed and complete the prescribed course unless your clinician changes the plan. A urine test or culture may help guide treatment.',
    homeCare: ['Drink fluids as advised by your care team and rest.', 'Take the medicine on schedule; do not share or save leftover antibiotics.', 'Arrange any recommended follow-up or repeat testing.'],
    redFlags: ['Get urgent care for worsening side or back pain, repeated vomiting, fainting, confusion, or rapidly worsening illness.', 'Contact your clinician if fever or pain is not improving as expected.'],
  },
  sinusitis: {
    title: 'Bacterial sinus infection',
    summary: 'Inflamed spaces around your nose can cause facial pressure, congestion, and thick nasal drainage.',
    body: 'Sinuses are small air-filled spaces around your nose and eyes. A cold or other irritation can make their lining swell and trap mucus. Most sinus infections are caused by viruses and get better without antibiotics; a clinician may consider antibiotics when symptoms strongly suggest bacteria.',
    antibiotic: 'If a clinician determines bacteria are likely, the chosen antibiotic targets those bacteria. Use it exactly as prescribed and finish the prescribed course unless your clinician changes the plan. Antibiotics do not help viral infections.',
    homeCare: ['Rest and drink fluids if your care plan allows.', 'Use medicines or saline rinses only as directed by your clinician or pharmacist.', 'Avoid smoke and attend follow-up if symptoms persist or worsen.'],
    redFlags: ['Seek urgent help for swelling or redness around an eye, vision changes, severe headache, confusion, or stiff neck.', 'Contact your clinician for a persistent high fever or symptoms that worsen after initially improving.'],
  },
  melioidosis: {
    title: 'Melioidosis',
    summary: 'A serious infection caused by bacteria found in some soil and water in tropical regions.',
    body: 'The bacteria can enter the body through cuts, inhaled dust or droplets, or contaminated water. The infection can affect the lungs, skin, or other parts of the body, so symptoms and treatment depend on where it is found.',
    antibiotic: 'Treatment requires clinician-selected antibiotics and may involve a longer treatment plan than many common infections. Take the exact medicine and duration prescribed, and do not stop early without speaking with your specialist.',
    homeCare: ['Keep every specialist and laboratory follow-up appointment.', 'Take medicine exactly as directed and tell your care team about side effects.', 'Ask your clinician about wound care and precautions for your specific infection.'],
    redFlags: ['Seek emergency care for difficulty breathing, severe weakness, confusion, fainting, or rapid worsening.', 'Contact your care team promptly for new fever or worsening symptoms during treatment.'],
  },
  'intra-abdominal': {
    title: 'Infection inside the abdomen',
    summary: 'An infection in the belly area that may involve an organ or the fluid around the organs.',
    body: 'Bacteria can cause inflammation inside the abdomen. Pain, fever, nausea, or a swollen belly may occur. Some causes also need a procedure or other treatment to control the source of infection.',
    antibiotic: 'Antibiotics may be used to treat bacteria, but the right plan depends on the source and test results. Take the prescribed medicine for the full duration unless your treating team changes it.',
    homeCare: ['Follow instructions about food, fluids, wound care, and activity after treatment.', 'Take medicines only as prescribed and keep follow-up appointments.', 'Ask your care team before taking new medicines for pain or stomach symptoms.'],
    redFlags: ['Get urgent help for severe or rapidly worsening belly pain, a hard or swollen abdomen, repeated vomiting, fainting, or confusion.', 'Contact your clinician for persistent fever or new symptoms.'],
  },
  general: {
    title: 'Your symptoms and next steps',
    summary: 'Your care team is reviewing the symptoms and possible causes together.',
    body: 'Different conditions can cause similar symptoms. Your clinician may use an examination, tests, and how symptoms change over time to understand what is happening.',
    antibiotic: 'Antibiotics only treat certain bacterial infections. Use them only when prescribed for you, follow the label, and finish the prescribed course unless your clinician tells you otherwise.',
    homeCare: ['Rest, and drink fluids if appropriate for your health and care plan.', 'Follow the instructions from your care team and attend recommended follow-up.', 'Ask a clinician or pharmacist before changing or stopping prescribed medicine.'],
    redFlags: ['Seek urgent help for severe breathing difficulty, fainting, confusion, or rapidly worsening symptoms.', 'If you are worried that your condition is worsening, contact your care team promptly.'],
  },
};

const infections: Infection[] = [
  {
    id: 'pneumonia',
    label: 'Community-acquired pneumonia',
    description: 'Illustrative adult outpatient options; actual selection depends on severity, testing, and local guidance.',
    antibiotics: [
      {
        id: 'amox-clav',
        name: 'Amoxicillin / clavulanate',
        drugClass: 'Aminopenicillin + beta-lactamase inhibitor',
        route: 'Oral',
        rank: 'First-line choice',
        allergyRisks: ['penicillin'],
        dose: (egfr) => egfr < 30
          ? { text: 'Avoid this example regimen; verify an alternative and renal plan', adjusted: true }
          : egfr < 60
            ? { text: '500 / 125 mg every 12 hours (example)', adjusted: true }
            : { text: '875 / 125 mg every 12 hours (example)', adjusted: false },
        note: 'Confirm indication, formulation, duration, and renal dosing against current local guidance.',
      },
      {
        id: 'doxy-pna',
        name: 'Doxycycline',
        drugClass: 'Tetracycline',
        route: 'Oral',
        rank: 'Alternative',
        allergyRisks: [],
        dose: () => ({ text: '100 mg every 12 hours (example)', adjusted: false }),
        note: 'Check pregnancy status, age-related precautions, interactions, and local recommendations.',
      },
      {
        id: 'azithro-pna',
        name: 'Azithromycin',
        drugClass: 'Macrolide',
        route: 'Oral',
        rank: 'Alternative',
        allergyRisks: ['macrolide'],
        requiresLftMonitoring: true,
        dose: () => ({ text: '500 mg on day 1, then 250 mg daily (example)', adjusted: false }),
        note: 'Consider local resistance, QT risk, interactions, and hepatic history.',
      },
      {
        id: 'levo-pna',
        name: 'Levofloxacin',
        drugClass: 'Respiratory fluoroquinolone',
        route: 'Oral or IV',
        rank: 'Alternative',
        allergyRisks: [],
        dose: (egfr) => egfr < 50
          ? { text: 'Renal-adjusted schedule required; verify by indication and renal estimate', adjusted: true }
          : { text: '750 mg every 24 hours (example)', adjusted: false },
        note: 'Reserve for selected cases after reviewing serious adverse-effect warnings, interactions, and alternatives.',
      },
    ],
  },
  {
    id: 'pyelonephritis',
    label: 'Pyelonephritis',
    description: 'Illustrative options only; obtain cultures when appropriate and follow local resistance guidance.',
    antibiotics: [
      {
        id: 'cipro-pyelo',
        name: 'Ciprofloxacin',
        drugClass: 'Fluoroquinolone',
        route: 'Oral or IV (clinician selected)',
        rank: 'First-line choice',
        allergyRisks: [],
        dose: (egfr) => egfr < 30
          ? { text: '250–500 mg every 18 hours (example; verify)', adjusted: true }
          : egfr < 60
            ? { text: '250–500 mg every 12 hours (example)', adjusted: true }
            : { text: '500 mg every 12 hours (example)', adjusted: false },
        note: 'Reserve fluoroquinolones for appropriate indications; review serious adverse-effect warnings and cultures.',
      },
      {
        id: 'ceftriaxone-pyelo',
        name: 'Ceftriaxone',
        drugClass: 'Third-generation cephalosporin',
        route: 'IV or IM',
        rank: 'Alternative',
        allergyRisks: ['penicillin'],
        dose: () => ({ text: '1 g every 24 hours (example; clinician directed)', adjusted: false }),
        note: 'Often used as an initial parenteral dose in selected cases; review allergy history and follow with culture-guided therapy.',
      },
      {
        id: 'tmp-smx-pyelo',
        name: 'Trimethoprim / sulfamethoxazole',
        drugClass: 'Folate antagonist + sulfonamide',
        route: 'Oral',
        rank: 'Alternative',
        allergyRisks: ['sulfa'],
        dose: (egfr) => egfr < 15
          ? { text: 'Avoid this example regimen; specialist review required', adjusted: true }
          : egfr < 30
            ? { text: 'Use reduced frequency only with clinician verification (example)', adjusted: true }
            : { text: '160 / 800 mg every 12 hours (example)', adjusted: false },
        note: 'Use culture-directed therapy where possible; monitor potassium, renal function, and interactions.',
      },
      {
        id: 'gent-pyelo',
        name: 'Gentamicin',
        drugClass: 'Aminoglycoside',
        route: 'IV or IM',
        rank: 'Alternative',
        allergyRisks: [],
        dose: (egfr) => egfr < 60
          ? { text: 'Individualized interval and serum-level monitoring required', adjusted: true }
          : { text: 'Weight-based dose with serum-level monitoring (example)', adjusted: false },
        requiresLftMonitoring: false,
        note: 'Nephrotoxicity and ototoxicity risks require clinician-supervised dosing and monitoring.',
      },
    ],
  },
  {
    id: 'melioidosis',
    label: 'Melioidosis',
    description: 'Specialist-managed infection; treatment depends on disease severity, site, and treatment phase.',
    antibiotics: [
      {
        id: 'ceftazidime-melio',
        name: 'Ceftazidime',
        drugClass: 'Third-generation cephalosporin',
        route: 'IV',
        rank: 'First-line choice',
        allergyRisks: ['penicillin'],
        dose: (egfr) => egfr < 50
          ? { text: 'Renal-adjusted IV schedule must be set by specialist (example)', adjusted: true }
          : { text: 'Specialist-directed IV schedule (example)', adjusted: false },
        note: 'Requires infectious-disease guidance, culture confirmation, and a complete eradication plan.',
      },
      {
        id: 'meropenem-melio',
        name: 'Meropenem',
        drugClass: 'Carbapenem',
        route: 'IV',
        rank: 'Alternative',
        allergyRisks: ['penicillin'],
        dose: (egfr) => egfr < 50
          ? { text: 'Renal-adjusted IV schedule must be set by specialist (example)', adjusted: true }
          : { text: 'Specialist-directed IV schedule (example)', adjusted: false },
        note: 'Typically reserved for severe disease or specific clinical circumstances under specialist care.',
      },
      {
        id: 'tmp-smx-melio',
        name: 'Trimethoprim / sulfamethoxazole',
        drugClass: 'Folate antagonist + sulfonamide',
        route: 'Oral',
        rank: 'Alternative',
        allergyRisks: ['sulfa'],
        dose: (egfr) => egfr < 30
          ? { text: 'Specialist renal-adjusted schedule required (example)', adjusted: true }
          : { text: 'Weight-based specialist-directed schedule (example)', adjusted: false },
        note: 'May be used in a specialist-directed treatment phase; monitor blood counts, potassium, and renal function.',
      },
    ],
  },
  {
    id: 'intra-abdominal',
    label: 'Intra-abdominal infection',
    description: 'Illustrative adult options; source control and severity assessment are essential to care.',
    antibiotics: [
      {
        id: 'pip-tazo-abd',
        name: 'Piperacillin / tazobactam',
        drugClass: 'Extended-spectrum penicillin + inhibitor',
        route: 'IV',
        rank: 'First-line choice',
        allergyRisks: ['penicillin'],
        dose: (egfr) => egfr < 40
          ? { text: 'Renal-adjusted IV schedule required (example)', adjusted: true }
          : { text: '3.375 g IV every 6 hours (example)', adjusted: false },
        note: 'Broad-spectrum IV therapy; confirm source, cultures, local protocol, and need for source control.',
      },
      {
        id: 'cef-met-abd',
        name: 'Ceftriaxone + metronidazole',
        drugClass: 'Cephalosporin + nitroimidazole',
        route: 'IV',
        rank: 'Alternative',
        allergyRisks: ['penicillin'],
        requiresLftMonitoring: true,
        dose: () => ({ text: '1–2 g IV daily + 500 mg every 8 hours (example)', adjusted: false }),
        note: 'Review allergy history, hepatic status, infection source, and local susceptibility patterns.',
      },
      {
        id: 'cipro-met-abd',
        name: 'Ciprofloxacin + metronidazole',
        drugClass: 'Fluoroquinolone + nitroimidazole',
        route: 'Oral or IV (clinician selected)',
        rank: 'Alternative',
        allergyRisks: [],
        requiresLftMonitoring: true,
        dose: (egfr) => egfr < 30
          ? { text: 'Ciprofloxacin renal adjustment required; verify complete regimen', adjusted: true }
          : { text: '500 mg + 500 mg orally every 12 hours (example)', adjusted: false },
        note: 'Check fluoroquinolone warnings, interactions, local resistance, and hepatic history.',
      },
    ],
  },
  {
    id: 'sinusitis',
    label: 'Acute bacterial sinusitis',
    description: 'Antibiotics are not routinely needed for sinus symptoms; these are illustrative options for clinician-confirmed bacterial disease.',
    antibiotics: [
      {
        id: 'amox-clav-sinus',
        name: 'Amoxicillin / clavulanate',
        drugClass: 'Aminopenicillin + beta-lactamase inhibitor',
        route: 'Oral',
        rank: 'First-line choice',
        allergyRisks: ['penicillin'],
        dose: (egfr) => egfr < 30
          ? { text: 'Avoid this example regimen; verify an alternative and renal plan', adjusted: true }
          : egfr < 60
            ? { text: '500 / 125 mg every 12 hours (example)', adjusted: true }
            : { text: '875 / 125 mg every 12 hours (example)', adjusted: false },
        note: 'Confirm bacterial indication, duration, formulation, and current local guidance.',
      },
      {
        id: 'doxy-sinus',
        name: 'Doxycycline',
        drugClass: 'Tetracycline',
        route: 'Oral',
        rank: 'Alternative',
        allergyRisks: [],
        dose: () => ({ text: '100 mg every 12 hours (example)', adjusted: false }),
        note: 'A possible alternative for selected adults; check pregnancy status, precautions, and local guidance.',
      },
      {
        id: 'levo-sinus',
        name: 'Levofloxacin',
        drugClass: 'Fluoroquinolone',
        route: 'Oral or IV (clinician selected)',
        rank: 'Alternative',
        allergyRisks: [],
        dose: (egfr) => egfr < 50
          ? { text: 'Renal-adjusted schedule required; verify before use', adjusted: true }
          : { text: '500 mg once daily (example)', adjusted: false },
        note: 'Reserve for limited situations after reviewing serious adverse-effect warnings and alternatives.',
      },
      {
        id: 'ceftriaxone-sinus',
        name: 'Ceftriaxone',
        drugClass: 'Third-generation cephalosporin',
        route: 'IV or IM',
        rank: 'Alternative',
        allergyRisks: ['penicillin'],
        dose: () => ({ text: '1–2 g every 24 hours (example; clinician directed)', adjusted: false }),
        note: 'Parenteral option only when clinically indicated; assess allergy history and care setting.',
      },
    ],
  },
];

const allergyLabels: Record<AllergyKey, string> = {
  penicillin: 'Penicillin',
  sulfa: 'Sulfa',
  macrolide: 'Macrolide',
};

const diagnosisToEducation: Record<string, InfectionId | 'general'> = {
  'Community-acquired pneumonia': 'pneumonia',
  'Acute pyelonephritis': 'pyelonephritis',
  'Acute viral syndrome': 'general',
  'Familial Mediterranean fever': 'general',
  'Acute bacterial sinusitis': 'sinusitis',
  Melioidosis: 'melioidosis',
};

const rareDiseases: RareDisease[] = [
  {
    id: 'rd-001',
    name: 'Familial Mediterranean Fever',
    category: 'Autoinflammatory',
    icd11: '4A60.0',
    prevalence: '1–5 per 10,000',
    description:
      'An inherited autoinflammatory condition characterized by recurrent episodes of fever and painful inflammation, often affecting the abdomen, chest, or joints.',
    symptoms: ['Recurrent fever', 'Serositis', 'Abdominal pain', 'Joint pain'],
    treatment: 'Long-term colchicine is commonly used to prevent attacks; specialist follow-up and monitoring are recommended.',
    detectionSignals: ['recurrent fever', 'serositis', 'recurrent abdominal pain', 'mediterranean fever'],
    icd10: 'E85.0',
    rationale: 'Recurrent, stereotyped attacks with fever and serosal pain can prompt evaluation for an autoinflammatory condition.',
    antibioticNote: 'Antibiotics do not treat this inherited autoinflammatory condition.',
  },
  {
    id: 'rd-002',
    name: 'Wilson Disease',
    category: 'Metabolic',
    icd11: '5C64.00',
    prevalence: '1–3 per 30,000',
    description:
      'A disorder of copper metabolism that can cause hepatic, neurologic, and psychiatric manifestations, typically beginning in adolescence or early adulthood.',
    symptoms: ['Liver dysfunction', 'Tremor', 'Behavioral changes', 'Kayser–Fleischer rings'],
    treatment: 'Copper-chelating therapy or zinc under specialist supervision, with lifelong biochemical monitoring.',
    detectionSignals: ['kayser fleischer', 'copper rings', 'wing beating tremor', 'low ceruloplasmin'],
    icd10: 'E83.01',
    rationale: 'A combination of liver, movement, and copper-related findings may warrant specialist testing.',
    antibioticNote: 'Antibiotics do not treat copper accumulation; seek a metabolic or hepatology evaluation.',
  },
  {
    id: 'rd-003',
    name: 'Acute Intermittent Porphyria',
    category: 'Metabolic',
    icd11: '5C56.00',
    prevalence: '1–2 per 100,000',
    description:
      'A heme synthesis disorder that may cause episodic neurovisceral attacks, often with severe abdominal pain and autonomic or neurologic symptoms.',
    symptoms: ['Severe abdominal pain', 'Neuropathy', 'Dark urine', 'Autonomic symptoms'],
    treatment: 'Avoidance of precipitating factors and specialist-directed hemin or carbohydrate therapy during acute attacks.',
    detectionSignals: ['dark urine abdominal pain', 'acute porphyria', 'neuropathic abdominal pain', 'porphyria attack'],
    icd10: 'E80.21',
    rationale: 'Episodic severe abdominal pain with neurologic or autonomic symptoms can prompt porphyria testing.',
    antibioticNote: 'Antibiotics are not a treatment; medication safety must be reviewed with a porphyria specialist.',
  },
  {
    id: 'rd-004',
    name: 'Hereditary Angioedema',
    category: 'Immunologic',
    icd11: '4A00.0',
    prevalence: '1 per 50,000',
    description:
      'A rare complement-system disorder causing recurrent, non-urticarial swelling of the skin, gastrointestinal tract, or upper airway.',
    symptoms: ['Recurrent swelling', 'Abdominal attacks', 'No urticaria', 'Airway risk'],
    treatment: 'An individualized emergency plan and access to on-demand bradykinin-targeted therapy are essential.',
    detectionSignals: ['non itchy swelling', 'no hives recurrent swelling', 'hereditary angioedema', 'recurrent airway swelling'],
    icd10: 'D84.1',
    rationale: 'Recurrent swelling without hives, especially with abdominal or airway attacks, needs timely specialist assessment.',
    antibioticNote: 'Antibiotics do not treat bradykinin-mediated swelling.',
  },
  {
    id: 'rd-005',
    name: 'Myasthenia Gravis',
    category: 'Autoimmune',
    icd11: '8C60.0',
    prevalence: '10–20 per 100,000',
    description:
      'An autoimmune disorder of neuromuscular transmission that causes fluctuating, fatigable weakness, often involving ocular or bulbar muscles.',
    symptoms: ['Ptosis', 'Double vision', 'Fatigable weakness', 'Swallowing difficulty'],
    treatment: 'Management may include acetylcholinesterase inhibitors and immunotherapy, guided by neurology assessment.',
    detectionSignals: ['fatigable weakness ptosis', 'double vision drooping eyelid', 'myasthenia gravis', 'weakness improves with rest'],
    icd10: 'G70.00',
    rationale: 'Fluctuating weakness affecting the eyes, speech, or swallowing may warrant neuromuscular evaluation.',
    antibioticNote: 'Antibiotics do not treat myasthenia; some medicines can worsen weakness and need clinician review.',
  },
  {
    id: 'rd-006',
    name: 'Gaucher Disease',
    category: 'Metabolic',
    icd11: '5C56.20',
    prevalence: '1 per 40,000–60,000',
    description:
      'An inherited lysosomal storage disorder that can cause enlarged spleen or liver, low blood counts, bone pain, and fatigue.',
    symptoms: ['Splenomegaly', 'Anemia', 'Bone pain', 'Easy bruising'],
    treatment: 'Enzyme replacement or substrate reduction therapy may be considered following diagnostic confirmation.',
    detectionSignals: ['enlarged spleen bone pain', 'gaucher disease', 'bone crises bruising', 'hepatosplenomegaly anemia'],
    icd10: 'E75.22',
    rationale: 'Enlarged spleen with low blood counts or characteristic bone symptoms can prompt lysosomal disease testing.',
    antibioticNote: 'Antibiotics do not treat this inherited storage disorder.',
  },
  {
    id: 'rd-007',
    name: 'Melioidosis',
    category: 'Infectious',
    icd11: '1C1G',
    prevalence: 'Endemic in parts of tropical regions',
    description: 'A bacterial infection associated with exposure to contaminated soil or water in endemic regions; it can affect the lungs, skin, or other organs.',
    symptoms: ['Fever after soil or water exposure', 'Pneumonia', 'Skin abscesses', 'Sepsis'],
    treatment: 'Requires urgent infectious-disease care. Treatment usually has an intensive IV phase and a prolonged eradication phase.',
    detectionSignals: ['melioidosis', 'burkholderia pseudomallei', 'soil exposure tropical fever', 'floodwater exposure pneumonia'],
    icd10: 'A24.1',
    rationale: 'Compatible serious illness with relevant tropical soil or water exposure needs urgent testing and specialist assessment.',
    antibioticNote: 'Not a self-treatment condition; specialist-directed IV ceftazidime or meropenem and a prolonged eradication phase may be required.',
  },
  {
    id: 'rd-008',
    name: 'Fabry Disease',
    category: 'Genetic / Metabolic',
    icd11: '5C56.10',
    prevalence: 'Approximately 1 per 40,000–60,000',
    description: 'An inherited condition where a fatty substance builds up in cells and can gradually affect nerves, skin, kidneys, heart, and brain.',
    symptoms: ['Burning pain in hands and feet', 'Reduced sweating', 'Small dark-red skin spots', 'Kidney or heart problems'],
    treatment: 'Specialist care may include enzyme replacement or other targeted therapy and regular organ monitoring.',
    detectionSignals: ['burning hands feet reduced sweating', 'fabry disease', 'angiokeratoma acroparesthesia', 'fabry kidney heart'],
    icd10: 'E75.21',
    rationale: 'Characteristic nerve pain with skin or sweating changes and organ involvement can prompt genetic/metabolic evaluation.',
    antibioticNote: 'Antibiotics do not treat this inherited metabolic condition.',
  },
  {
    id: 'rd-009',
    name: 'Granulomatosis with polyangiitis',
    category: 'Autoimmune',
    icd11: '4A44.0',
    prevalence: 'Approximately 3–14 per million',
    description: 'A rare inflammation of blood vessels that can affect the nose, sinuses, lungs, and kidneys.',
    symptoms: ['Persistent sinus or ear symptoms', 'Coughing blood', 'Blood in urine', 'Unexplained fatigue'],
    treatment: 'Requires prompt specialist assessment; treatment often involves immunosuppressive medicines and organ monitoring.',
    detectionSignals: ['coughing blood blood in urine', 'granulomatosis with polyangiitis', 'sinus kidney lung vasculitis', 'wegener vasculitis'],
    icd10: 'M31.30',
    rationale: 'Combined upper-airway, lung, or kidney findings can indicate serious vasculitis and need urgent work-up.',
    antibioticNote: 'Antibiotics alone do not treat vasculitis; rule out infection and arrange specialist evaluation.',
  },
  {
    id: 'rd-010',
    name: 'Atypical hemolytic uremic syndrome',
    category: 'Genetic / Hematologic',
    icd11: '3A50.2',
    prevalence: 'Approximately 1–2 per million',
    description: 'A rare condition where small blood clots can damage blood cells, platelets, and the kidneys.',
    symptoms: ['Low platelets', 'Anemia', 'Acute kidney injury', 'Unusual bruising'],
    treatment: 'A medical emergency requiring urgent hematology/nephrology care and cause-specific treatment.',
    detectionSignals: ['low platelets anemia kidney injury', 'atypical hemolytic uremic syndrome', 'ahus hemolysis thrombocytopenia', 'fragmented red blood cells kidney failure'],
    icd10: 'D59.31',
    rationale: 'Anemia, low platelets, and acute kidney injury together require emergency evaluation.',
    antibioticNote: 'Antibiotics are not a treatment for complement-mediated aHUS; emergency specialist care is required.',
  },
  {
    id: 'rd-011',
    name: 'Guillain–Barré syndrome',
    category: 'Neurological / Autoimmune',
    icd11: '8C01.0',
    prevalence: 'Approximately 1–2 per 100,000 per year',
    description: 'The immune system mistakenly affects nerves, often causing weakness and tingling that can move upward through the body.',
    symptoms: ['Progressive weakness in both legs', 'Tingling in hands and feet', 'Difficulty walking', 'Weakness after infection'],
    treatment: 'Urgent hospital monitoring may be needed because breathing and swallowing muscles can become weak.',
    detectionSignals: ['progressive weakness', 'tingling in hands and feet', 'ascending weakness after infection', 'guillain barre syndrome', 'weakness difficulty walking tingling'],
    icd10: 'G61.0',
    rationale: 'New progressive weakness with tingling can worsen quickly and needs urgent neurologic assessment.',
    antibioticNote: 'Antibiotics do not treat the immune-related nerve injury; urgent hospital assessment is important.',
  },
  {
    id: 'rd-012',
    name: 'Systemic mastocytosis',
    category: 'Genetic / Hematologic',
    icd11: '2A20.0',
    prevalence: 'Rare; estimates vary by population',
    description: 'A condition where too many mast cells collect in the body and can release chemicals that cause skin or whole-body symptoms.',
    symptoms: ['Flushing', 'Itchy skin lesions', 'Anaphylaxis', 'Abdominal cramping'],
    treatment: 'A specialist can confirm the diagnosis and create a plan for trigger avoidance and emergency reactions.',
    detectionSignals: ['flushing anaphylaxis mast cells', 'systemic mastocytosis', 'recurrent anaphylaxis skin lesions', 'mast cell activation tryptase'],
    icd10: 'C96.21',
    rationale: 'Recurrent severe allergic-type reactions with characteristic skin or laboratory findings merit specialist review.',
    antibioticNote: 'Antibiotics do not treat mast-cell disease; suspected anaphylaxis is an emergency.',
  },
  {
    id: 'rd-013',
    name: 'Acromegaly',
    category: 'Metabolic / Endocrine',
    icd11: '5A60.0',
    prevalence: 'Approximately 3–14 per 100,000',
    description: 'Usually caused by a benign pituitary growth that makes too much growth hormone, gradually changing bones and soft tissues.',
    symptoms: ['Increasing ring or shoe size', 'Larger hands or feet', 'Changes in facial features', 'Headache or vision changes'],
    treatment: 'Endocrinology assessment and targeted treatment can reduce hormone levels and protect health.',
    detectionSignals: ['increasing shoe ring size enlarged hands jaw', 'acromegaly', 'coarse facial features enlarged hands', 'pituitary growth hormone excess'],
    icd10: 'E22.0',
    rationale: 'Gradual enlargement of hands, feet, or facial features can warrant hormone testing and pituitary evaluation.',
    antibioticNote: 'Antibiotics do not treat hormone overproduction.',
  },
  {
    id: 'rd-014',
    name: 'Huntington disease',
    category: 'Genetic / Neurological',
    icd11: '8A01.1',
    prevalence: 'Approximately 5–10 per 100,000 in some populations',
    description: 'An inherited brain condition that can affect movement, mood, and thinking over time.',
    symptoms: ['Involuntary dance-like movements', 'Changes in thinking', 'Mood changes', 'Family history'],
    treatment: 'Neurology and genetic counseling can support diagnosis, symptom management, and family planning.',
    detectionSignals: ['involuntary chorea family history', 'huntington disease', 'progressive chorea cognitive decline', 'jerky movements inherited'],
    icd10: 'G10',
    rationale: 'Progressive involuntary movements with relevant family history can prompt neurologic and genetic evaluation.',
    antibioticNote: 'Antibiotics do not treat this inherited neurologic condition.',
  },
  {
    id: 'rd-015',
    name: 'Ehlers–Danlos syndrome',
    category: 'Genetic / Connective tissue',
    icd11: 'LD28.0',
    prevalence: 'Varies by subtype',
    description: 'A group of inherited conditions that affect connective tissue, which supports skin, joints, and blood vessels.',
    symptoms: ['Very flexible joints', 'Frequent joint dislocations', 'Stretchy or fragile skin', 'Easy bruising'],
    treatment: 'Care is tailored to the subtype and may include joint protection, physical therapy, and specialist monitoring.',
    detectionSignals: ['hypermobile joints stretchy skin dislocations', 'ehlers danlos syndrome', 'joint hypermobility easy bruising', 'recurrent dislocations fragile skin'],
    icd10: 'Q79.6',
    rationale: 'Joint hypermobility with skin or tissue features can prompt assessment for a connective-tissue condition.',
    antibioticNote: 'Antibiotics do not treat connective-tissue disorders.',
  },
];

const differentialCatalog: Differential[] = [
  {
    name: 'Community-acquired pneumonia',
    icd10: 'J18.9',
    baseProbability: 52,
    keywords: ['cough', 'fever', 'breath', 'sputum', 'chest', 'pneumonia'],
    antibiotic: 'Antibiotics are considered only when bacterial pneumonia is suspected; assess severity, local resistance, and current guidelines.',
    rationale: 'Respiratory symptoms with fever can be consistent with a lower respiratory tract infection.',
  },
  {
    name: 'Acute pyelonephritis',
    icd10: 'N10',
    baseProbability: 43,
    keywords: ['urine', 'urinary', 'flank', 'kidney', 'dysuria', 'frequency'],
    antibiotic: 'Obtain urine culture when indicated; tailor antimicrobial choice to local resistance patterns.',
    rationale: 'Urinary symptoms with fever or flank discomfort warrant assessment for upper urinary infection.',
  },
  {
    name: 'Acute viral syndrome',
    icd10: 'B34.9',
    baseProbability: 38,
    keywords: ['fever', 'fatigue', 'aches', 'sore throat', 'congestion', 'viral'],
    antibiotic: 'Antibiotics are not indicated for uncomplicated viral illness.',
    rationale: 'Fever with generalized symptoms may reflect a self-limited viral illness.',
  },
  {
    name: 'Familial Mediterranean fever',
    icd10: 'E85.0',
    baseProbability: 24,
    keywords: ['recurrent fever', 'stereotyped attacks', 'serositis', 'familial mediterranean fever'],
    isRare: true,
    antibiotic: 'Not an indication for antibiotics; assess for autoinflammatory disease with a specialist.',
    rationale: 'Recurrent stereotyped febrile episodes with serosal or joint symptoms may merit rare-disease evaluation.',
  },
  {
    name: 'Acute bacterial sinusitis',
    icd10: 'J01.90',
    baseProbability: 30,
    keywords: ['sinus', 'facial', 'congestion', 'nasal', 'pressure', 'discharge'],
    antibiotic: 'Use watchful waiting or guideline-directed treatment based on duration and severity.',
    rationale: 'Persistent or severe sinus symptoms may indicate acute rhinosinusitis.',
  },
  {
    name: 'Melioidosis',
    icd10: 'A24.1',
    baseProbability: 22,
    keywords: ['melioidosis', 'soil exposure', 'floodwater', 'tropical', 'burkholderia pseudomallei'],
    isRare: true,
    antibiotic: 'Requires urgent specialist assessment; intensive-phase ceftazidime or meropenem is clinician-directed IV therapy, followed by a separate eradication phase.',
    rationale: 'Relevant soil or water exposure in an endemic area with compatible illness can warrant urgent testing and infectious-disease consultation.',
  },
];

const tabs: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'diagnosis', label: 'AI Diagnosis', icon: Stethoscope },
  { id: 'antibiotic', label: 'Antibiotic Stewardship', icon: ShieldCheck },
  { id: 'database', label: 'Rare Disease Explorer', icon: Microscope },
];

const fieldClass =
  'w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20';
const panelClass = 'rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/10 backdrop-blur-md';

async function createPatientPseudonym(name: string): Promise<string> {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('Secure browser cryptography is unavailable.');
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const normalizedName = name.trim().normalize('NFKC').toLocaleLowerCase();
  const nameBytes = new TextEncoder().encode(normalizedName);
  const payload = new Uint8Array(salt.length + nameBytes.length);
  payload.set(salt);
  payload.set(nameBytes, salt.length);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', payload);
  const token = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8)
    .toUpperCase();
  return `PAT-${token}-${new Date().getFullYear()}`;
}

function PatientEducationPanel({
  education,
  antibioticName,
}: {
  education: PatientEducation;
  antibioticName?: string;
}) {
  const educationId = education.title.toLowerCase().replace(/\s+/g, '-');
  return (
    <section aria-labelledby={`education-${educationId}`} className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-300">Patient information</p>
          <h3 id={`education-${educationId}`} className="mt-1 text-lg font-semibold text-white">
            {education.title}: a guide for you
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{education.summary}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h4 className="text-xs font-bold text-slate-200">What is happening in your body?</h4>
          <p className="mt-2 text-xs leading-6 text-slate-400">{education.body}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
          <h4 className="text-xs font-bold text-emerald-300">Why this antibiotic may be prescribed</h4>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            {antibioticName ? <><span className="font-semibold text-slate-200">{antibioticName}: </span></> : null}
            {education.antibiotic}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h4 className="flex items-center gap-2 text-xs font-bold text-slate-200"><Droplets className="h-4 w-4 text-cyan-300" aria-hidden="true" />Home care</h4>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-400">
            {education.homeCare.map((guideline) => <li key={guideline} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />{guideline}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
          <h4 className="flex items-center gap-2 text-xs font-bold text-rose-300"><AlertTriangle className="h-4 w-4" aria-hidden="true" />When to get help</h4>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-300">
            {education.redFlags.map((warning) => <li key={warning} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />{warning}</li>)}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-5 text-slate-500">This plain-language guide is educational and does not replace instructions from your treating clinician.</p>
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('diagnosis');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedPatient, setSubmittedPatient] = useState<{ patientId: string; age: number; symptoms: string } | null>(null);
  const [privacyError, setPrivacyError] = useState('');
  const [isCreatingPatientId, setIsCreatingPatientId] = useState(false);
  const [selectedDiagnosisModal, setSelectedDiagnosisModal] = useState<(Differential & { matchCount: number; score: number; probability: number }) | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [egfr, setEgfr] = useState(90);
  const [allergies, setAllergies] = useState<AllergyKey[]>([]);
  const [selectedInfectionId, setSelectedInfectionId] = useState<InfectionId>('pneumonia');
  const [selectedAntibioticId, setSelectedAntibioticId] = useState('amox-clav');
  const [educationConditionId, setEducationConditionId] = useState<InfectionId | 'general'>('general');
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [prescriptionSigned, setPrescriptionSigned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All categories');
  const [selectedDisease, setSelectedDisease] = useState<RareDisease | null>(null);

  const matchedDiagnoses = useMemo(() => {
    if (!submittedPatient) return [];
    const text = submittedPatient.symptoms.toLowerCase();
    const commonMatches = differentialCatalog
      .map((diagnosis) => {
        const matchCount = diagnosis.keywords.filter((keyword) => text.includes(keyword)).length;
        const baselineScore = diagnosis.baseProbability + matchCount * 11;
        const rareSignalScore = diagnosis.isRare && matchCount > 0 ? 58 + matchCount * 12 : baselineScore;
        return { ...diagnosis, matchCount, score: rareSignalScore };
      });
    const knownNames = new Set(differentialCatalog.map((diagnosis) => diagnosis.name.toLocaleLowerCase()));
    const rareMatches = rareDiseases
      .filter((disease) => !knownNames.has(disease.name.toLocaleLowerCase()) && disease.detectionSignals)
      .map((disease) => {
        const keywords = disease.detectionSignals ?? [];
        const matchCount = keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
        return {
          name: disease.name,
          icd10: disease.icd10 ?? 'See specialist reference',
          baseProbability: 18,
          keywords,
          isRare: true,
          antibiotic: disease.antibioticNote ?? 'Antibiotics are not a treatment for this condition unless a separate bacterial infection is diagnosed.',
          rationale: disease.rationale ?? disease.description,
          matchCount,
          score: matchCount > 0 ? 58 + matchCount * 12 : 18,
        };
      })
      .filter((diagnosis) => diagnosis.matchCount > 0);
    return [...commonMatches, ...rareMatches]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((diagnosis, index) => ({
        ...diagnosis,
        probability: Math.max(14, Math.min(94, diagnosis.score - index * 5)),
      }));
  }, [submittedPatient]);

  const filteredDiseases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return rareDiseases.filter((disease) => {
      const categoryMatches = category === 'All categories' || disease.category === category;
      const searchMatches =
        !query ||
        disease.name.toLowerCase().includes(query) ||
        disease.category.toLowerCase().includes(query) ||
        disease.icd11.toLowerCase().includes(query) ||
        disease.symptoms.some((symptom) => symptom.toLowerCase().includes(query)) ||
        disease.detectionSignals?.some((signal) => signal.toLowerCase().includes(query));
      return categoryMatches && searchMatches;
    });
  }, [category, searchTerm]);
  const diseaseCategories = ['All categories', ...Array.from(new Set(rareDiseases.map((disease) => disease.category))).sort()];

  const renalStatus =
    egfr < 30 ? 'Severe impairment' : egfr < 60 ? 'Moderate impairment' : 'Normal renal function';
  const selectedInfection = infections.find((infection) => infection.id === selectedInfectionId) ?? infections[0];
  const matchingAntibiotics = selectedInfection.antibiotics.filter(
    (antibiotic) =>
      !antibiotic.allergyRisks.some((allergy) => allergies.includes(allergy)) &&
      antibiotic.dose(egfr).suitable !== false,
  );
  const contraindicatedAntibiotics = selectedInfection.antibiotics.filter(
    (antibiotic) =>
      antibiotic.allergyRisks.some((allergy) => allergies.includes(allergy)) ||
      antibiotic.dose(egfr).suitable === false,
  );
  const selectedAntibiotic =
    matchingAntibiotics.find((antibiotic) => antibiotic.id === selectedAntibioticId) ?? matchingAntibiotics[0];
  const selectedDose = selectedAntibiotic?.dose(egfr);
  const education = educationByCondition[educationConditionId];
  const diagnosisModalInfectionId = selectedDiagnosisModal
    ? diagnosisToEducation[selectedDiagnosisModal.name]
    : undefined;
  const diagnosisModalInfection = diagnosisModalInfectionId && diagnosisModalInfectionId !== 'general'
    ? infections.find((infection) => infection.id === diagnosisModalInfectionId)
    : undefined;
  const diagnosisModalRareDisease = selectedDiagnosisModal?.isRare
    ? rareDiseases.find((disease) => disease.name.toLocaleLowerCase() === selectedDiagnosisModal.name.toLocaleLowerCase())
    : undefined;
  const diagnosisModalAntibiotics = diagnosisModalInfection?.antibiotics.filter(
    (antibiotic) =>
      !antibiotic.allergyRisks.some((allergy) => allergies.includes(allergy)) &&
      antibiotic.dose(egfr).suitable !== false,
  ) ?? [];

  useEffect(() => {
    if (!isPrescriptionOpen && !selectedDisease && !isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPrescriptionOpen(false);
        setSelectedDisease(null);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPrescriptionOpen, selectedDisease, isModalOpen]);

  const submitDiagnosis = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingPatientId) return;
    setPrivacyError('');
    const errors: Record<string, string> = {};
    if (!patientName.trim()) errors.name = 'Enter the patient name.';
    const numericAge = Number(age);
    if (!age || !Number.isFinite(numericAge) || numericAge <= 0) errors.age = 'Age must be greater than 0.';
    if (symptoms.trim().length < 10) errors.symptoms = 'Describe symptoms in at least 10 characters.';
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setSubmittedPatient(null);
      return;
    }
    setIsCreatingPatientId(true);
    try {
      const patientId = await createPatientPseudonym(patientName);
      setSubmittedPatient({ patientId, age: numericAge, symptoms: symptoms.trim() });
      setPatientName('');
      setFormErrors({});
    } catch {
      setSubmittedPatient(null);
      setPrivacyError('A secure patient identifier could not be created. No assessment was processed; verify this browser supports Web Crypto and try again.');
      return;
    } finally {
      setIsCreatingPatientId(false);
    }
    const symptomText = symptoms.toLowerCase();
    const nextEducationCondition: InfectionId | 'general' = symptomText.includes('melioidosis') || symptomText.includes('burkholderia pseudomallei') || symptomText.includes('soil exposure')
      ? 'melioidosis'
      : symptomText.includes('urine') || symptomText.includes('flank') || symptomText.includes('dysuria')
      ? 'pyelonephritis'
      : symptomText.includes('cough') || symptomText.includes('breath') || symptomText.includes('sputum')
        ? 'pneumonia'
        : 'general';
    setEducationConditionId(nextEducationCondition);
    if (nextEducationCondition !== 'general') {
      setSelectedInfectionId(nextEducationCondition);
      setSelectedAntibioticId('');
    }
  };

  const resetPrescription = () => {
    setIsPrescriptionOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-cyan-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Shield className="h-6 w-6" aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">AegisMed AI</h1>
                <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-cyan-300">
                  CDSS
                </span>
              </div>
              <p className="text-xs text-slate-500">Clinical decision support & antimicrobial stewardship</p>
            </div>
          </div>

          <nav aria-label="Main navigation" className="-mx-1 overflow-x-auto">
            <div className="flex min-w-max gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1" role="tablist">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={`panel-${id}`}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    activeTab === id
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="hidden items-center gap-2 text-xs text-slate-400 xl:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Decision support online
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto min-h-[calc(100vh-170px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Clinical intelligence workspace
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {activeTab === 'diagnosis'
                ? 'Patient assessment'
                : activeTab === 'antibiotic'
                  ? 'Antibiotic stewardship'
                  : 'Rare disease explorer'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {activeTab === 'diagnosis'
                ? 'Explore a structured differential from the clinical picture, with clear reasoning and next steps.'
                : activeTab === 'antibiotic'
                  ? 'Review patient-specific antibiotic considerations before a prescription is verified.'
                  : 'Search a curated reference of rare conditions, classifications, and care considerations.'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400 sm:self-auto">
            <LockKeyhole className="h-4 w-4 text-purple-400" aria-hidden="true" />
            <span>Local pseudonymization</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>No external AI calls</span>
          </div>
        </section>

        <aside aria-label="Patient data privacy notice" className="mb-6 flex flex-col gap-3 rounded-2xl border border-purple-400/20 bg-purple-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10 text-purple-300"><LockKeyhole className="h-4 w-4" aria-hidden="true" /></div>
            <div>
              <p className="text-xs font-bold text-purple-200">Privacy-first demo · salted SHA-256 pseudonymization</p>
              <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-400">On submission, the name is converted locally to a session-specific pseudonymous ID and the name field is cleared. Matching runs in this browser; no external AI service is called. Pseudonymization is not encryption and this demo is not certified HIPAA/PDP compliant.</p>
            </div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-400/[0.08] px-2.5 py-1.5 text-[10px] font-semibold text-purple-200"><LockKeyhole className="h-3 w-3" aria-hidden="true" />Local-only · not compliance certified</span>
        </aside>

        {activeTab === 'diagnosis' && (
          <section id="panel-diagnosis" role="tabpanel" aria-labelledby="tab-diagnosis" className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <div className={`${panelClass} h-fit p-5 sm:p-6`}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <HeartPulse className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Patient snapshot</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Enter the encounter details to build a suggested differential.</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  New assessment
                </span>
              </div>
              <form onSubmit={submitDiagnosis} noValidate className="space-y-5">
                <div>
                  <label htmlFor="patient-name" className="mb-2 block text-xs font-semibold text-slate-300">
                    Patient name
                  </label>
                  <input
                    id="patient-name"
                    name="patientName"
                    autoComplete="name"
                    value={patientName}
                    onChange={(event) => {
                      setPatientName(event.target.value);
                      setSubmittedPatient(null);
                      setFormErrors((current) => ({ ...current, name: '' }));
                    }}
                    aria-invalid={Boolean(formErrors.name)}
                    aria-describedby={formErrors.name ? 'patient-name-error' : undefined}
                    placeholder="e.g. Jordan Lee"
                    className={`${fieldClass} ${formErrors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {formErrors.name && <p id="patient-name-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-rose-400"><AlertCircle className="h-3.5 w-3.5" />{formErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="patient-age" className="mb-2 block text-xs font-semibold text-slate-300">
                    Age <span className="font-normal text-slate-500">(years)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="patient-age"
                      name="age"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={age}
                      onChange={(event) => {
                        setAge(event.target.value);
                        setSubmittedPatient(null);
                        setFormErrors((current) => ({ ...current, age: '' }));
                      }}
                      aria-invalid={Boolean(formErrors.age)}
                      aria-describedby={formErrors.age ? 'patient-age-error' : undefined}
                      placeholder="Enter age"
                      className={`${fieldClass} pr-16 ${formErrors.age ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">years</span>
                  </div>
                  {formErrors.age && <p id="patient-age-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-rose-400"><AlertCircle className="h-3.5 w-3.5" />{formErrors.age}</p>}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="patient-symptoms" className="block text-xs font-semibold text-slate-300">Clinical symptoms</label>
                    <span className={`text-[10px] ${symptoms.trim().length < 10 ? 'text-slate-500' : 'text-emerald-400'}`}>
                      {symptoms.trim().length}/10 min
                    </span>
                  </div>
                  <textarea
                    id="patient-symptoms"
                    name="symptoms"
                    rows={5}
                    value={symptoms}
                    onChange={(event) => {
                      setSymptoms(event.target.value);
                      setSubmittedPatient(null);
                      setFormErrors((current) => ({ ...current, symptoms: '' }));
                    }}
                    aria-invalid={Boolean(formErrors.symptoms)}
                    aria-describedby={formErrors.symptoms ? 'patient-symptoms-error' : 'symptoms-hint'}
                    placeholder="Describe the presenting symptoms, onset, duration, and relevant findings..."
                    className={`${fieldClass} resize-y leading-6 ${formErrors.symptoms ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {formErrors.symptoms ? (
                    <p id="patient-symptoms-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-rose-400"><AlertCircle className="h-3.5 w-3.5" />{formErrors.symptoms}</p>
                  ) : (
                    <p id="symptoms-hint" className="mt-2 text-[11px] leading-5 text-slate-500">Include symptoms in the patient's own clinical context.</p>
                  )}
                </div>
                <button type="submit" disabled={isCreatingPatientId} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-70">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {isCreatingPatientId ? 'Creating private patient ID…' : 'Generate differential'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
                {privacyError && <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs leading-5 text-rose-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{privacyError}</p>}
                <p className="flex items-start gap-2 border-t border-slate-800 pt-4 text-[11px] leading-5 text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                  Decision-support suggestions are informational and require review by a qualified clinician.
                </p>
              </form>
            </div>

            <div aria-live="polite" className="space-y-4">
              {!submittedPatient ? (
                <div className={`${panelClass} flex min-h-[430px] flex-col items-center justify-center p-8 text-center`}>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 text-slate-500">
                    <FileHeart className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200">Your differential appears here</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Complete the patient snapshot to review ranked possibilities and clinical context.</p>
                  <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />Structured symptom matching <span className="mx-1 text-slate-700">·</span> Clinician reviewed</div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300"><ClipboardCheck className="h-4 w-4" aria-hidden="true" /></div>
                      <div>
                        <p className="text-sm font-semibold text-white">Assessment · {submittedPatient.patientId}</p>
                        <p className="text-[11px] text-slate-400">Age {submittedPatient.age} · {matchedDiagnoses.length} suggested differentials</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Analysis complete</span>
                  </div>
                  <div className="space-y-3">
                    {matchedDiagnoses.map((diagnosis, index) => {
                      const highRisk = diagnosis.probability >= 65;
                      return (
                        <article
                          key={diagnosis.name}
                          role="button"
                          tabIndex={0}
                          aria-haspopup="dialog"
                          aria-label={`Open details for ${diagnosis.name}, ${diagnosis.probability}% match`}
                          onClick={() => {
                            setSelectedDiagnosisModal(diagnosis);
                            setIsModalOpen(true);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedDiagnosisModal(diagnosis);
                              setIsModalOpen(true);
                            }
                          }}
                          className={`${panelClass} group cursor-pointer overflow-hidden transition duration-200 hover:scale-[1.01] hover:border-cyan-400/40 hover:shadow-[0_0_28px_rgba(6,182,212,0.1)] focus:outline-none focus:ring-2 focus:ring-cyan-400/70`}
                        >
                          <div className={`h-0.5 ${highRisk ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}`} />
                          <div className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-slate-800 text-xs font-bold text-cyan-300">{String(index + 1).padStart(2, '0')}</span>
                                <div>
                                  <h3 className="font-semibold text-white">{diagnosis.name}</h3>
                                  <p className="mt-1 font-mono text-[11px] text-slate-500">ICD-10 · {diagnosis.icd10}</p>
                                </div>
                              </div>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${highRisk ? 'border-rose-400/20 bg-rose-400/10 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.08)]' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'}`}>
                                {diagnosis.probability}% match
                              </span>
                            </div>
                            <div className="ml-11 mt-4">
                              <p className="text-xs leading-5 text-slate-400">{diagnosis.rationale}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {diagnosis.isRare && <span className="rounded-md border border-purple-400/30 bg-purple-400/10 px-2 py-1 text-[10px] font-bold text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.14)]">Rare disease alert</span>}
                                <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-[10px] text-slate-400">{diagnosis.matchCount} symptom signal{diagnosis.matchCount === 1 ? '' : 's'}</span>
                              </div>
                              <div className="mt-4 flex gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                                <Pill className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                                <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Antibiotic / care note</p><p className="mt-1 text-xs leading-5 text-slate-400">{diagnosis.antibiotic}</p></div>
                              </div>
                              <p className="mt-3 text-right text-[10px] font-semibold text-cyan-400/70 transition group-hover:text-cyan-300">Click to view diagnosis details <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" /></p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <p className="flex items-start gap-2 px-1 text-[11px] leading-5 text-slate-500"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />Match percentages are illustrative demo scores, not validated clinical probabilities.</p>
                </>
              )}
            </div>
            <div className="space-y-3 lg:col-span-2">
              {submittedPatient && matchedDiagnoses.length > 0 && (
                <div className="max-w-md">
                  <label htmlFor="education-diagnosis" className="mb-2 block text-xs font-semibold text-slate-300">Patient explanation for diagnosis</label>
                  <select
                    id="education-diagnosis"
                    value={matchedDiagnoses.find((diagnosis) => diagnosisToEducation[diagnosis.name] === educationConditionId)?.name ?? matchedDiagnoses[0].name}
                    onChange={(event) => {
                      const condition = diagnosisToEducation[event.target.value] ?? 'general';
                      setEducationConditionId(condition);
                      if (condition !== 'general') {
                        setSelectedInfectionId(condition);
                        setSelectedAntibioticId('');
                      }
                    }}
                    className={fieldClass}
                  >
                    {matchedDiagnoses.map((diagnosis) => <option key={diagnosis.name} value={diagnosis.name}>{diagnosis.name}</option>)}
                  </select>
                </div>
              )}
              <PatientEducationPanel education={education} />
            </div>
          </section>
        )}

        {activeTab === 'antibiotic' && (
          <section id="panel-antibiotic" role="tabpanel" aria-labelledby="tab-antibiotic" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className={`${panelClass} p-5 sm:p-6`}>
              <div className="mb-7">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
                <h3 className="text-lg font-semibold text-white">Match a treatment option</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Select the working diagnosis and patient-specific safety factors.</p>
              </div>
              <div className="space-y-7">
                <div>
                  <label htmlFor="infection-diagnosis" className="mb-2 block text-xs font-semibold text-slate-300">Diagnosis / infection</label>
                  <div className="relative">
                    <select
                      id="infection-diagnosis"
                      value={selectedInfectionId}
                      onChange={(event) => {
                        setSelectedInfectionId(event.target.value as InfectionId);
                        setSelectedAntibioticId('');
                        setPrescriptionSigned(false);
                      }}
                      className={`${fieldClass} appearance-none pr-10`}
                    >
                      {infections.map((infection) => <option key={infection.id} value={infection.id}>{infection.label}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">{selectedInfection.description}</p>
                </div>
                <div>
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <label htmlFor="egfr" className="text-sm font-semibold text-slate-200">Renal function <span className="block pt-1 text-[11px] font-normal text-slate-500">Estimated GFR (mL/min/1.73m²)</span></label>
                    <div className="text-right"><span className="font-mono text-2xl font-bold text-cyan-300">{egfr}</span><span className="ml-1 text-[10px] text-slate-500">mL/min</span></div>
                  </div>
                  <input id="egfr" type="range" min="10" max="120" step="1" value={egfr} onChange={(event) => { setEgfr(Number(event.target.value)); setPrescriptionSigned(false); }} aria-valuetext={`${egfr} milliliters per minute per 1.73 square meters`} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400" />
                  <div className="mt-2 flex justify-between text-[10px] text-slate-600"><span>10 · Severe</span><span>60</span><span>120 · Normal</span></div>
                  <div className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${egfr < 30 ? 'border-rose-400/20 bg-rose-400/[0.06] text-rose-300' : egfr < 60 ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300' : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300'}`}>
                    <Activity className="h-4 w-4" aria-hidden="true" />
                    <span className="font-semibold">{renalStatus}</span>
                    <span className="text-slate-500">· compatible options update automatically</span>
                  </div>
                </div>
                <fieldset className="border-t border-slate-800 pt-6">
                  <legend className="mb-3 text-xs font-semibold text-slate-300">Known medication allergies</legend>
                  <div className="space-y-2">
                    {(Object.keys(allergyLabels) as AllergyKey[]).map((allergy) => {
                      const id = `allergy-${allergy}`;
                      return (
                        <label key={allergy} htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 transition hover:border-slate-700">
                          <input
                            id={id}
                            type="checkbox"
                            checked={allergies.includes(allergy)}
                            onChange={(event) => {
                              setAllergies((current) => event.target.checked
                                ? [...current, allergy]
                                : current.filter((item) => item !== allergy));
                              setPrescriptionSigned(false);
                            }}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-xs font-medium text-slate-200">{allergyLabels[allergy]} allergy</span>
                          <span className="ml-auto text-[10px] text-slate-500">screening</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Clinical review reminder</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">These mock regimens are not prescribing guidance. Verify allergy history, cultures, indication, dose, interactions, and local protocols.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Matched options</p><h3 className="mt-1 text-lg font-semibold text-white">{matchingAntibiotics.length} suitable option{matchingAntibiotics.length === 1 ? '' : 's'}</h3></div>
                <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] text-slate-400">eGFR {egfr} · allergy-screened</span>
              </div>
              {prescriptionSigned && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Demo prescription review signed for {selectedAntibiotic?.name ?? 'the selected regimen'}.</p>}
              {matchingAntibiotics.length > 0 ? (
                <div className="space-y-3">
                  {matchingAntibiotics.map((antibiotic) => {
                    const doseRecommendation = antibiotic.dose(egfr);
                    const isSelected = selectedAntibiotic?.id === antibiotic.id;
                    return (
                      <article key={antibiotic.id} className={`${panelClass} overflow-hidden transition ${isSelected ? 'border-cyan-400/30 shadow-[0_0_28px_rgba(6,182,212,0.06)]' : 'hover:border-slate-700'}`}>
                        <div className={`h-0.5 ${antibiotic.rank === 'First-line choice' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-slate-700'}`} />
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div><h4 className="font-semibold text-white">{antibiotic.name}</h4><p className="mt-1 text-xs text-slate-500">{antibiotic.drugClass}</p></div>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${antibiotic.rank === 'First-line choice' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{antibiotic.rank}</span>
                          </div>
                          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dose example · verify before use</p>
                            <p className="mt-1 text-sm font-semibold text-cyan-300">{doseRecommendation.text}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {allergies.includes('penicillin') && !antibiotic.allergyRisks.includes('penicillin') && <span className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-1 text-[10px] font-semibold text-emerald-300">Safe (Non-Penicillin)</span>}
                            {doseRecommendation.adjusted
                              ? <span className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[10px] font-semibold text-amber-300">Renal adjustment applied</span>
                              : <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-[10px] text-slate-400">Renal function reviewed</span>}
                            {antibiotic.requiresLftMonitoring && <span className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[10px] font-semibold text-amber-300">Requires LFT monitoring</span>}
                          </div>
                          <p className="mt-3 text-[11px] leading-5 text-slate-500">{antibiotic.note}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAntibioticId(antibiotic.id);
                              setPrescriptionSigned(false);
                              setIsPrescriptionOpen(true);
                            }}
                            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${isSelected ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus:ring-emerald-300' : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-400/30 hover:text-cyan-200 focus:ring-cyan-400'}`}
                          >
                            <BadgeCheck className="h-4 w-4" aria-hidden="true" />Select &amp; sign prescription
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div role="status" className={`${panelClass} p-6 text-center`}>
                  <AlertTriangle className="mx-auto h-7 w-7 text-amber-400" aria-hidden="true" />
                  <h4 className="mt-3 font-semibold text-white">No options match the selected allergy filters</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Do not remove an allergy to force a match. Confirm the allergy history and consult local specialist guidance.</p>
                </div>
              )}
              {contraindicatedAntibiotics.length > 0 && (
                <aside aria-labelledby="contraindications-title" className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
                  <h4 id="contraindications-title" className="flex items-center gap-2 text-xs font-bold text-rose-300"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Excluded for safety review</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">These options were filtered due to a selected allergy. Confirm specific allergy and cross-reactivity with a qualified clinician.</p>
                  <ul className="mt-3 space-y-2">
                    {contraindicatedAntibiotics.map((antibiotic) => {
                      const reasons = antibiotic.allergyRisks.filter((allergy) => allergies.includes(allergy)).map((allergy) => `${allergyLabels[allergy]} allergy`);
                      if (antibiotic.dose(egfr).suitable === false) reasons.push('renal function limitation in this example');
                      return <li key={antibiotic.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs"><span className="font-semibold text-slate-200">{antibiotic.name}</span><span className="text-rose-300">{reasons.join(' · ')}</span></li>;
                    })}
                  </ul>
                </aside>
              )}
            </div>
            <div className="space-y-3 lg:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-300">Patient education</p><p className="mt-1 text-xs text-slate-500">Plain-language guidance for the selected diagnosis.</p></div>
              </div>
              <PatientEducationPanel education={educationByCondition[selectedInfectionId]} antibioticName={selectedAntibiotic?.name} />
            </div>
          </section>
        )}

        {activeTab === 'database' && (
          <section id="panel-database" role="tabpanel" aria-labelledby="tab-database">
            <div className={`${panelClass} mb-6 p-5 sm:p-6`}>
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div><div className="mb-2 flex items-center gap-2 text-cyan-300"><Microscope className="h-4 w-4" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-[0.18em]">Curated reference</span></div><h3 className="text-lg font-semibold text-white">Rare disease knowledge base</h3><p className="mt-1 text-xs text-slate-500">Search by condition, category, ICD-11 code, or hallmark symptom.</p></div>
                <div className="w-full space-y-3 lg:w-[560px]">
                  <div className="relative"><label htmlFor="disease-search" className="sr-only">Search rare diseases</label><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="disease-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search diseases, ICD-11 codes, or symptoms..." className={`${fieldClass} pl-10`} /></div>
                  <div role="group" aria-label="Filter rare diseases by category" className="flex flex-wrap gap-1.5">
                    {diseaseCategories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={category === item}
                        onClick={() => setCategory(item)}
                        className={`rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition ${category === item ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-slate-700 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
                <p aria-live="polite">Showing <span className="font-semibold text-slate-300">{filteredDiseases.length}</span> of {rareDiseases.length} conditions</p>
                {(searchTerm || category !== 'All categories') && <button type="button" onClick={() => { setSearchTerm(''); setCategory('All categories'); }} className="text-cyan-300 transition hover:text-cyan-200">Clear filters</button>}
              </div>
            </div>
            {filteredDiseases.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDiseases.map((disease) => (
                  <article key={disease.id} className={`${panelClass} group flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-2xl hover:shadow-cyan-950/10`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-amber-300">{disease.category}</span>
                      <span className="font-mono text-[10px] text-slate-500">ICD-11 {disease.icd11}</span>
                    </div>
                    <h4 className="mt-4 text-base font-semibold leading-6 text-white">{disease.name}</h4>
                    <p className="mt-1 text-[11px] text-slate-500">Estimated prevalence: <span className="text-slate-300">{disease.prevalence}</span></p>
                    <p className="mt-4 flex-1 text-xs leading-6 text-slate-400">{disease.description}</p>
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Hallmark symptoms</p>
                      <div className="flex flex-wrap gap-1.5">{disease.symptoms.map((symptom) => <span key={symptom} className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-400">{symptom}</span>)}</div>
                    </div>
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Treatment overview</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{disease.treatment}</p>
                      <button type="button" onClick={() => setSelectedDisease(disease)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200 focus:outline-none focus:underline">Open clinical reference <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`${panelClass} flex flex-col items-center px-6 py-16 text-center`}>
                <Search className="h-8 w-8 text-slate-600" aria-hidden="true" /><h3 className="mt-4 font-semibold text-slate-200">No matching conditions</h3><p className="mt-1 text-sm text-slate-500">Try another name, code, symptom, or category.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 AegisMed AI <span className="mx-1.5 text-slate-700">·</span> Clinical decision support system</p>
          <p className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />Demo interface — recommendations require professional review</p>
        </div>
      </footer>

      {isModalOpen && selectedDiagnosisModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="diagnosis-modal-title"
            aria-describedby="diagnosis-modal-description"
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl shadow-cyan-950/30"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-[#111827]/95 p-5 backdrop-blur sm:p-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
                  {String(matchedDiagnoses.findIndex((item) => item.name === selectedDiagnosisModal.name) + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">{selectedDiagnosisModal.probability}% match</span>
                    {selectedDiagnosisModal.isRare && <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold text-purple-200">Rare disease alert</span>}
                  </div>
                  <h2 id="diagnosis-modal-title" className="text-lg font-bold text-white sm:text-xl">{selectedDiagnosisModal.name}</h2>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">ICD-10 · {selectedDiagnosisModal.icd10}</p>
                </div>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setIsModalOpen(false)}
                aria-label="Close diagnosis details"
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <section aria-labelledby="diagnosis-overview-title" className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 id="diagnosis-overview-title" className="text-xs font-bold uppercase tracking-wider text-cyan-300">Disease overview · in plain language</h3>
                <p id="diagnosis-modal-description" className="mt-2 text-sm leading-6 text-slate-300">
                  {diagnosisModalInfectionId
                    ? educationByCondition[diagnosisModalInfectionId].body
                    : diagnosisModalRareDisease?.description ?? `${selectedDiagnosisModal.name} may cause symptoms like ${selectedDiagnosisModal.keywords.slice(0, 4).join(', ')}. ${selectedDiagnosisModal.rationale}`}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  <span className="font-semibold text-slate-200">Common symptom signals: </span>
                  {diagnosisModalRareDisease?.symptoms.join(' · ') ?? selectedDiagnosisModal.keywords.slice(0, 4).join(' · ')}.
                  {' '}These symptoms can have other causes; a clinician may need an exam or tests to confirm the diagnosis.
                </p>
              </section>

              {diagnosisModalInfectionId && diagnosisModalInfectionId !== 'general' ? (
                <section aria-labelledby="diagnosis-antibiotics-title">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-300">Condition-specific protocol examples</p>
                      <h3 id="diagnosis-antibiotics-title" className="mt-1 text-base font-semibold text-white">Suitable antibiotic options</h3>
                    </div>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-400">
                      {diagnosisModalAntibiotics.length} option{diagnosisModalAntibiotics.length === 1 ? '' : 's'} after allergy screening
                    </span>
                  </div>
                  {diagnosisModalInfection && <p className="mb-3 text-xs leading-5 text-slate-500">{diagnosisModalInfection.description}</p>}
                  {diagnosisModalAntibiotics.length ? (
                    <div className="space-y-3">
                      {diagnosisModalAntibiotics.map((antibiotic) => {
                        const doseRecommendation = antibiotic.dose(egfr);
                        const safeForPenicillin = !antibiotic.allergyRisks.includes('penicillin');
                        return (
                          <article key={antibiotic.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-white">{antibiotic.name}</h4>
                                <p className="mt-1 text-xs text-slate-500">{antibiotic.drugClass} <span className="mx-1 text-slate-700">·</span> Route: {antibiotic.route}</p>
                              </div>
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${antibiotic.rank === 'First-line choice' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                                {antibiotic.rank}
                              </span>
                            </div>
                            <div className="mt-3 rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommended dosage example · eGFR {egfr}</p>
                              <p className="mt-1 text-sm font-semibold text-cyan-300">{doseRecommendation.text}</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${antibiotic.rank === 'First-line choice' ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{antibiotic.rank}</span>
                              {doseRecommendation.adjusted && <span className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[10px] font-semibold text-amber-300">Renal dose adjustment required</span>}
                              {safeForPenicillin && <span className="rounded-md border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1 text-[10px] font-semibold text-cyan-300">Safe for Penicillin Allergy</span>}
                              {antibiotic.requiresLftMonitoring && <span className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[10px] font-semibold text-amber-300">LFT monitoring</span>}
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-slate-500">{antibiotic.note}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInfectionId(diagnosisModalInfectionId);
                                setSelectedAntibioticId(antibiotic.id);
                                setEducationConditionId(diagnosisModalInfectionId);
                                setPrescriptionSigned(false);
                                setIsModalOpen(false);
                                setActiveTab('antibiotic');
                                setIsPrescriptionOpen(true);
                              }}
                              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            >
                              <BadgeCheck className="h-4 w-4" aria-hidden="true" />Select &amp; sign this option
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div role="status" className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-xs leading-5 text-amber-200">
                      No listed antibiotic matches the selected allergy filters. Do not remove a known allergy to force a match; confirm the history and consult current specialist guidance.
                    </div>
                  )}
                </section>
              ) : (
                <section className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
                  <h3 className="text-xs font-bold text-amber-300">Antibiotics are not automatically appropriate</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {selectedDiagnosisModal.name === 'Acute viral syndrome'
                      ? 'Antibiotics do not treat viruses. A clinician should assess whether testing, symptom care, or another treatment is appropriate.'
                      : 'This differential does not have an infection-specific antibiotic protocol in this demo. Please confirm the diagnosis before considering antimicrobial treatment.'}
                  </p>
                </section>
              )}

              {(
                <section aria-labelledby="diagnosis-home-care-title" className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <h3 id="diagnosis-home-care-title" className="flex items-center gap-2 text-xs font-bold text-slate-200"><Droplets className="h-4 w-4 text-cyan-300" aria-hidden="true" />Home care</h3>
                    <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-400">
                      {educationByCondition[diagnosisModalInfectionId ?? 'general'].homeCare.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />{item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-rose-300"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Red flags</h3>
                    <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-300">
                      {educationByCondition[diagnosisModalInfectionId ?? 'general'].redFlags.map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />{item}</li>)}
                    </ul>
                  </div>
                </section>
              )}
              {diagnosisModalRareDisease && (
                <section className="rounded-xl border border-purple-400/20 bg-purple-400/[0.04] p-4">
                  <h3 className="text-xs font-bold text-purple-200">Specialist care context</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{diagnosisModalRareDisease.treatment}</p>
                </section>
              )}
              <p className="flex items-start gap-2 border-t border-slate-800 pt-4 text-[10px] leading-5 text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                Educational demo content only. Diagnosis and antibiotic choices must be verified by a qualified clinician against current local guidance.
              </p>
            </div>
          </section>
        </div>
      )}

      {isPrescriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) resetPrescription(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="prescription-modal-title" aria-describedby="prescription-modal-description" className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between border-b border-slate-800 p-5 sm:p-6">
              <div><div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Safety verification</div><h2 id="prescription-modal-title" className="text-xl font-bold text-white">{prescriptionSigned ? 'Prescription verified' : 'Verify prescription'}</h2><p id="prescription-modal-description" className="mt-1 text-xs leading-5 text-slate-400">Review the suggested regimen and patient factors before confirming.</p></div>
              <button type="button" autoFocus onClick={resetPrescription} aria-label="Close prescription dialog" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">Diagnosis</span><span className="text-right font-semibold text-white">{selectedInfection.label}</span></div>
                <div className="mt-3 flex justify-between gap-3 text-xs"><span className="text-slate-500">Medication</span><span className="text-right font-semibold text-white">{selectedAntibiotic?.name ?? 'No matching option'}</span></div>
                <div className="mt-3 flex justify-between gap-3 text-xs"><span className="text-slate-500">Suggested dosage</span><span className="text-right font-semibold text-cyan-300">{selectedDose?.text ?? 'Not available'}</span></div>
                <div className="mt-3 flex justify-between gap-3 text-xs"><span className="text-slate-500">Patient factors</span><span className="text-right text-slate-300">eGFR {egfr} · {allergies.length ? allergies.map((allergy) => allergyLabels[allergy]).join(', ') : 'no listed allergy selected'}</span></div>
              </div>
              <div className="flex gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5 text-xs leading-5 text-amber-200/90">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <p>Demo only. Confirm indication, allergy history, renal dosing, interactions, duration, and local guidance. This interface does not transmit or create a real prescription.</p>
              </div>
              {prescriptionSigned ? (
                <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 text-xs font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Review acknowledged — demo signature recorded locally.</div>
              ) : (
                <button type="button" onClick={() => setPrescriptionSigned(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900"><Check className="h-4 w-4" aria-hidden="true" />Acknowledge &amp; sign demo review</button>
              )}
              {prescriptionSigned && <button type="button" onClick={resetPrescription} className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">Close</button>}
            </div>
          </section>
        </div>
      )}

      {selectedDisease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDisease(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="disease-modal-title" className="my-auto w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between border-b border-slate-800 p-5 sm:p-6">
              <div><span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-amber-300">{selectedDisease.category}</span><h2 id="disease-modal-title" className="mt-3 text-xl font-bold text-white">{selectedDisease.name}</h2><p className="mt-1 font-mono text-xs text-slate-500">ICD-11 · {selectedDisease.icd11} <span className="mx-1 text-slate-700">/</span> Prevalence · {selectedDisease.prevalence}</p></div>
              <button type="button" autoFocus onClick={() => setSelectedDisease(null)} aria-label="Close clinical reference" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical overview</h3><p className="mt-2 text-sm leading-6 text-slate-300">{selectedDisease.description}</p></div>
              <div><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hallmark symptoms</h3><div className="mt-2 flex flex-wrap gap-2">{selectedDisease.symptoms.map((symptom) => <span key={symptom} className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300">{symptom}</span>)}</div></div>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Treatment &amp; management</h3><p className="mt-2 text-sm leading-6 text-slate-300">{selectedDisease.treatment}</p></div>
              <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />Reference information is educational and should be confirmed with current specialist guidance.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
