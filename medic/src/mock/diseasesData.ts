import type { Disease, TherapyOption } from '../types';

const noTherapy: TherapyOption[] = [];

function therapy(
  id: string,
  name: string,
  className: string,
  status: TherapyOption['status'],
  allergyRisks: TherapyOption['allergyRisks'],
  note: string,
): TherapyOption {
  return {
    id,
    name,
    className,
    status,
    allergyRisks,
    contraindications: allergyRisks,
    baseDose: 'Dose and duration require clinician selection under the current local protocol.',
    renalDoseBelow30: 'Illustration only: renal adjustment is required; do not apply a fixed 50% reduction without protocol review.',
    dosage: 'No dose is supplied by this educational dataset.',
    egfrAdjustments: [{ below: 30, guidance: 'Check a current drug-specific renal dosing reference; no fixed percentage adjustment is provided.' }],
    note,
  };
}

const commonTherapies = {
  betaLactam: therapy('beta-lactam-example', 'Protocol-directed beta-lactam', 'Penicillin / cephalosporin', 'First-line example', ['penicillin'], 'Confirm indication, exact allergy phenotype, culture data, dose, duration, and local susceptibility guidance.'),
  doxycycline: therapy('doxycycline-example', 'Doxycycline (selected cases)', 'Tetracycline', 'Alternative example', [], 'Only for selected patients when clinically appropriate; review pregnancy, age, interactions, and local guidance.'),
  nitrofurantoin: therapy('nitrofurantoin-example', 'Nitrofurantoin (selected lower UTI)', 'Nitrofuran', 'First-line example', [], 'Only for selected uncomplicated lower urinary infection; not for suspected pyelonephritis or systemic infection. Check renal function and local guidance.'),
  tmpSmx: therapy('tmp-smx-example', 'Trimethoprim / sulfamethoxazole (culture-directed)', 'Sulfonamide combination', 'Alternative example', ['sulfa'], 'Use only when appropriate and supported by susceptibility; review potassium, renal function, interactions, and allergy history.'),
  specialist: therapy('specialist-directed', 'Specialist-directed treatment', 'Condition-specific', 'Specialist therapy', [], 'This condition requires diagnostic confirmation and an individualized specialist treatment plan.'),
};

const commonEducation = {
  respiratory: {
    homeCare: ['Follow the clinician’s care plan, rest, and maintain fluids if permitted.', 'Keep follow-up and testing appointments.'],
    redFlags: ['Severe breathing difficulty, blue lips, confusion, fainting, or rapid worsening requires urgent care.'],
  },
  urinary: {
    homeCare: ['Use medicines only as prescribed and arrange any recommended urine testing.', 'Drink fluids as advised by the treating team.'],
    redFlags: ['Fever with flank pain, repeated vomiting, confusion, or markedly reduced urine needs urgent assessment.'],
  },
  abdominal: {
    homeCare: ['Seek assessment for persistent or severe abdominal pain; do not delay urgent evaluation.'],
    redFlags: ['Severe or rigid abdominal pain, fainting, repeated vomiting, or confusion requires urgent care.'],
  },
  general: {
    homeCare: ['Arrange an appropriate clinician assessment; do not self-diagnose or change prescribed treatment based on this demo.'],
    redFlags: ['Sudden severe symptoms, new confusion, fainting, breathing difficulty, or rapid worsening needs urgent help.'],
  },
};

function disease(
  id: string,
  name: string,
  category: string,
  icd11: string,
  keywords: string[],
  symptoms: string[],
  summary: string,
  careNote: string,
  rare: boolean,
  therapies: TherapyOption[] = noTherapy,
  education: keyof typeof commonEducation = 'general',
): Disease {
  return {
    id,
    name,
    category,
    icd11,
    icd11Code: icd11,
    icd11Verified: false,
    keywords,
    symptoms,
    symptomSignals: keywords,
    summary,
    ...commonEducation[education],
    careNote,
    rare,
    therapies,
    recommendedAntibiotics: therapies,
  };
}

export const diseases: Disease[] = [
  disease('cap', 'Community-acquired pneumonia (CAP)', 'Respiratory / Infectious', 'MMS verification required', ['pneumonia', 'cough', 'fever', 'sputum', 'shortness of breath', 'chest pain'], ['Cough', 'Fever', 'Sputum', 'Shortness of breath'], 'Pneumonia is inflammation or infection in the lungs. Causes include bacteria and viruses; symptoms alone cannot determine the cause.', 'Antibiotics are not appropriate for every pneumonia. Confirm diagnosis, severity, likely cause, allergies, and local guidance.', false, [commonTherapies.betaLactam, commonTherapies.doxycycline], 'respiratory'),
  disease('strep-throat', 'Streptococcal pharyngitis (strep throat)', 'Respiratory / Infectious', 'MMS verification required', ['strep throat', 'sore throat', 'painful swallowing', 'fever', 'tonsil exudate'], ['Sore throat', 'Painful swallowing', 'Fever', 'Tender neck glands'], 'A sore throat can have many causes. Strep throat is a bacterial infection that needs appropriate testing and clinical assessment.', 'Symptoms alone do not confirm strep. Testing and treatment decisions should follow current local guidance.', false, [commonTherapies.betaLactam], 'respiratory'),
  disease('sinusitis', 'Acute bacterial sinusitis', 'Respiratory / Infectious', 'MMS verification required', ['sinusitis', 'sinus pressure', 'facial pain', 'nasal discharge', 'congestion'], ['Facial pressure', 'Nasal congestion', 'Discharge', 'Persistent symptoms'], 'Sinus inflammation often follows a viral cold. Many cases are viral and improve without antibiotics; bacterial disease needs clinical assessment.', 'Consider antibiotics only when a clinician finds the presentation consistent with bacterial disease and local guidance supports treatment.', false, [commonTherapies.betaLactam, commonTherapies.doxycycline], 'respiratory'),
  disease('melioidosis', 'Melioidosis', 'Infectious / Tropical', 'MMS verification required', ['melioidosis', 'burkholderia pseudomallei', 'soil exposure', 'floodwater', 'tropical fever'], ['Fever after soil or water exposure', 'Pneumonia', 'Skin abscesses', 'Sepsis'], 'Melioidosis is a potentially serious bacterial infection associated with contaminated soil or water in some regions.', 'Requires urgent testing and infectious-disease management with phase-specific specialist treatment. Not suitable for self-treatment.', true, [therapy('melioidosis-specialist', 'Specialist-directed intensive and eradication phases', 'Culture-directed antimicrobial therapy', 'Specialist therapy', ['penicillin', 'sulfa'], 'Use specialist and public-health protocols; the correct regimen depends on disease site, susceptibility, phase, and patient factors.')], 'respiratory'),
  disease('pulmonary-tb', 'Pulmonary tuberculosis', 'Respiratory / Infectious', 'MMS verification required', ['tuberculosis', 'pulmonary tb', 'weeks of cough', 'night sweats', 'weight loss', 'coughing blood'], ['Cough lasting weeks', 'Night sweats', 'Weight loss', 'Coughing blood'], 'Tuberculosis is an airborne bacterial infection that commonly affects the lungs. Testing and public-health coordination are important.', 'Requires testing and a complete multidrug TB-program regimen; never treat with a single antibiotic or this demo.', false, [therapy('tb-program', 'Public-health TB-program regimen', 'Multidrug specialist regimen', 'Specialist therapy', [], 'Diagnosis, drug susceptibility, interactions, and public-health follow-up determine treatment.')], 'respiratory'),
  disease('bronchitis', 'Acute bronchitis', 'Respiratory / Infectious', 'MMS verification required', ['bronchitis', 'chest cold', 'acute cough', 'wheezing', 'mucus'], ['Acute cough', 'Mucus', 'Wheezing'], 'Acute bronchitis is temporary inflammation of the larger airways, commonly due to a virus.', 'Antibiotics are not routinely indicated for uncomplicated acute bronchitis; assess alternative diagnoses and red flags.', false, noTherapy, 'respiratory'),
  disease('pyelonephritis', 'Acute pyelonephritis', 'Renal / Urinary', 'MMS verification required', ['pyelonephritis', 'kidney infection', 'flank pain', 'fever', 'dysuria'], ['Fever', 'Flank pain', 'Painful urination', 'Nausea'], 'A kidney infection may cause fever, flank pain, nausea, or urinary symptoms and may become serious.', 'Prompt clinical assessment and urine culture when appropriate; antibiotic choice depends on severity, susceptibility, allergy, and local guidance.', false, [commonTherapies.betaLactam, commonTherapies.tmpSmx], 'urinary'),
  disease('uti', 'Uncomplicated urinary tract infection', 'Renal / Urinary', 'MMS verification required', ['uti', 'cystitis', 'painful urination', 'dysuria', 'urinary urgency', 'frequency'], ['Painful urination', 'Urgency', 'Frequency'], 'A bladder infection can cause burning, urgency, or frequent urination. Similar symptoms can have other causes.', 'Only use a lower-UTI regimen when the diagnosis and patient eligibility are confirmed; do not use lower-tract agents for kidney/systemic infection.', false, [commonTherapies.nitrofurantoin, commonTherapies.tmpSmx], 'urinary'),
  disease('sepsis-aki', 'Acute kidney injury secondary to sepsis', 'Renal / Urinary / Emergency', 'MMS verification required', ['sepsis', 'acute kidney injury', 'aki', 'low urine', 'oliguria', 'creatinine rise'], ['Sepsis', 'Reduced urine output', 'Acute kidney injury'], 'Acute kidney injury is a sudden loss of kidney function. Severe infection can contribute and needs emergency care.', 'Emergency clinician-led sepsis evaluation and source management; drug and fluid decisions require immediate individualized review.', false, [therapy('sepsis-specialist', 'Emergency sepsis protocol', 'Source- and culture-directed', 'Specialist therapy', [], 'This is an emergency pathway, not outpatient antibiotic selection.')], 'general'),
  disease('gastroenteritis', 'Acute gastroenteritis', 'Gastrointestinal', 'MMS verification required', ['gastroenteritis', 'diarrhea', 'vomiting', 'watery stool', 'stomach bug', 'abdominal cramps'], ['Diarrhea', 'Vomiting', 'Abdominal cramps'], 'Gastroenteritis irritates the stomach and bowel and may cause diarrhea, vomiting, and cramps. Many cases resolve with supportive care.', 'Antibiotics are not indicated for most uncomplicated cases; assess dehydration, exposure, and illness severity.', false, noTherapy, 'abdominal'),
  disease('intra-abdominal-sepsis', 'Intra-abdominal sepsis', 'Gastrointestinal / Emergency', 'MMS verification required', ['intra-abdominal sepsis', 'abdominal sepsis', 'peritonitis', 'severe abdominal pain'], ['Severe abdominal pain', 'Fever', 'Possible sepsis'], 'A serious infection inside the abdomen can affect the whole body and may require hospital care and source control.', 'Urgent emergency evaluation; antimicrobial choice and procedural care must follow clinician and local protocols.', false, [therapy('abd-sepsis-specialist', 'Emergency source-control pathway', 'Culture- and source-directed', 'Specialist therapy', ['penicillin'], 'Do not delay urgent care or rely on a mock regimen.')], 'abdominal'),
  disease('appendicitis', 'Acute appendicitis', 'Gastrointestinal / Surgical', 'MMS verification required', ['appendicitis', 'right lower abdominal pain', 'right lower quadrant', 'pain moved to right'], ['Lower-right abdominal pain', 'Pain migration', 'Nausea', 'Fever'], 'Appendicitis is inflammation of a small pouch connected to the bowel and can worsen or rupture.', 'Urgent surgical assessment is required. Antibiotics, if appropriate, do not replace assessment for source control.', false, [therapy('appendicitis-surgical', 'Surgical assessment / clinician-directed care', 'Procedural and antimicrobial care', 'Specialist therapy', ['penicillin'], 'Urgent in-person evaluation; no self-treatment advice.')], 'abdominal'),
  disease('cholecystitis', 'Acute cholecystitis', 'Gastrointestinal / Surgical', 'MMS verification required', ['cholecystitis', 'gallbladder', 'right upper abdominal pain', 'right upper quadrant', 'gallstones'], ['Right upper abdominal pain', 'Fever', 'Nausea', 'Gallstones'], 'Gallbladder inflammation is often associated with a stone blocking bile flow and may require hospital care.', 'Prompt clinician evaluation; care may include imaging, source control, and clinician-selected antimicrobials.', false, [therapy('cholecystitis-specialist', 'Hospital and source-control assessment', 'Clinician-directed', 'Specialist therapy', ['penicillin'], 'Treatment depends on severity, patient factors, and local protocol.')], 'abdominal'),
  disease('fabry', 'Fabry disease', 'Genetic / Metabolic', 'MMS verification required', ['fabry', 'burning hands', 'burning feet', 'reduced sweating', 'angiokeratoma', 'acroparesthesia'], ['Burning hands or feet', 'Reduced sweating', 'Skin spots', 'Kidney or heart symptoms'], 'Fabry disease is an inherited condition that can cause a fatty substance to build up in cells and affect nerves, skin, kidneys, heart, or brain.', 'Antibiotics do not treat Fabry disease. Specialist evaluation and tailored disease-specific treatment are required.', true, [commonTherapies.specialist]),
  disease('gpa', 'Granulomatosis with polyangiitis (GPA)', 'Autoimmune / Vasculitis', 'MMS verification required', ['granulomatosis with polyangiitis', 'gpa', 'coughing blood', 'blood in urine', 'sinus kidney lung vasculitis'], ['Sinus symptoms', 'Coughing blood', 'Blood in urine', 'Fatigue'], 'GPA is inflammation of blood vessels that can affect the nose, lungs, and kidneys.', 'Antibiotics do not treat vasculitis. Prompt specialist evaluation is needed; rule out infection before immunosuppression.', true, [commonTherapies.specialist], 'respiratory'),
  disease('ahus', 'Atypical hemolytic uremic syndrome (aHUS)', 'Genetic / Hematologic / Renal', 'MMS verification required', ['ahus', 'atypical hemolytic uremic syndrome', 'low platelets anemia kidney injury', 'hemolysis thrombocytopenia'], ['Low platelets', 'Anemia', 'Kidney injury', 'Unusual bruising'], 'aHUS is a rare condition involving abnormal clotting in small blood vessels that may damage blood cells, platelets, and kidneys.', 'Possible aHUS is a medical emergency requiring urgent hematology and nephrology input; antibiotics are not the treatment for complement-mediated disease.', true, [commonTherapies.specialist], 'general'),
  disease('gbs', 'Guillain–Barré syndrome (GBS)', 'Neurological / Autoimmune', 'MMS verification required', ['guillain barre', 'gbs', 'progressive weakness', 'ascending weakness', 'tingling in hands and feet', 'difficulty walking'], ['Progressive weakness', 'Tingling', 'Difficulty walking', 'Recent infection'], 'GBS is an immune-related nerve condition that can cause progressive weakness and tingling, sometimes after an infection.', 'Progressive weakness can affect breathing and swallowing. Urgent hospital evaluation is required; antibiotics do not treat nerve injury.', true, [commonTherapies.specialist]),
  disease('gaucher', 'Gaucher disease', 'Genetic / Metabolic', 'MMS verification required', ['gaucher', 'enlarged spleen', 'bone pain', 'bone crises', 'hepatosplenomegaly anemia'], ['Enlarged spleen', 'Anemia', 'Bone pain', 'Easy bruising'], 'Gaucher disease is an inherited storage condition that can affect the spleen, liver, blood counts, and bones.', 'Specialist confirmation and disease-specific management; antibiotics are not a treatment for the inherited condition.', true, [commonTherapies.specialist]),
  disease('mastocytosis', 'Systemic mastocytosis', 'Hematologic / Immunologic', 'MMS verification required', ['systemic mastocytosis', 'flushing anaphylaxis mast cells', 'recurrent anaphylaxis', 'tryptase'], ['Flushing', 'Skin lesions', 'Anaphylaxis', 'Abdominal symptoms'], 'Mastocytosis involves an abnormal increase of mast cells, which can cause skin or whole-body symptoms.', 'Specialist assessment and an emergency allergy plan; suspected anaphylaxis is an emergency.', true, [commonTherapies.specialist]),
  disease('acromegaly', 'Acromegaly', 'Endocrine / Metabolic', 'MMS verification required', ['acromegaly', 'increasing shoe size', 'larger hands', 'jaw enlargement', 'growth hormone'], ['Increasing ring or shoe size', 'Larger hands or feet', 'Facial changes', 'Headache or vision change'], 'Acromegaly is usually caused by excess growth hormone over time and can gradually change bones and soft tissues.', 'Endocrinology assessment is needed; antibiotics do not treat hormone overproduction.', true, [commonTherapies.specialist]),
  disease('huntington', 'Huntington disease', 'Genetic / Neurological', 'MMS verification required', ['huntington', 'involuntary chorea', 'progressive chorea', 'family history chorea'], ['Involuntary movements', 'Thinking changes', 'Mood changes', 'Family history'], 'Huntington disease is an inherited brain condition that can affect movement, thinking, and mood over time.', 'Neurology and genetic counseling can support care. Antibiotics do not treat this inherited condition.', true, [commonTherapies.specialist]),
  disease('eds-vascular', 'Vascular Ehlers–Danlos syndrome (vEDS)', 'Genetic / Connective tissue', 'MMS verification required', ['vascular ehlers danlos', 'vascular eds', 'arterial rupture family history', 'translucent skin easy bruising'], ['Easy bruising', 'Thin translucent skin', 'Vascular events in family', 'Organ fragility'], 'Vascular Ehlers–Danlos syndrome is an inherited connective-tissue condition that can make blood vessels and some organs fragile.', 'Specialist genetics and cardiovascular care are important. Sudden severe pain or fainting is an emergency.', true, [commonTherapies.specialist]),
  disease('porphyria', 'Acute intermittent porphyria', 'Metabolic / Genetic', 'MMS verification required', ['acute intermittent porphyria', 'porphyria attack', 'dark urine abdominal pain', 'neuropathic abdominal pain'], ['Severe abdominal pain', 'Neuropathy', 'Dark urine', 'Autonomic symptoms'], 'Acute intermittent porphyria is an inherited heme-production condition that can cause episodic abdominal and nerve symptoms.', 'Medication safety and acute treatment require specialist advice; do not assume an antibiotic is safe.', true, [commonTherapies.specialist], 'abdominal'),
  disease('hereditary-angioedema', 'Hereditary angioedema', 'Genetic / Immunologic', 'MMS verification required', ['hereditary angioedema', 'recurrent swelling without hives', 'lip swelling', 'throat swelling', 'abdominal attacks'], ['Recurrent skin swelling', 'Abdominal attacks', 'Throat swelling'], 'Hereditary angioedema is an inherited condition that can cause episodes of swelling under the skin or in the digestive tract.', 'Throat or tongue swelling can obstruct breathing and is an emergency. Specialist diagnosis and a personalized emergency plan are essential.', true, [commonTherapies.specialist], 'general'),
];

export const rareDiseases = diseases.filter((condition) => condition.rare);
export const allergyLabels = {
  penicillin: 'Penicillin / beta-lactam',
  sulfa: 'Sulfonamide',
  macrolide: 'Macrolide',
} as const;
