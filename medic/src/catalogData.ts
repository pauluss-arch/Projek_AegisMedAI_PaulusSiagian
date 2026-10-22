export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  audience: string;
};

export const catalogItems: CatalogItem[] = [
  {
    id: '1',
    name: 'AI Diagnosis',
    description: 'Explore a structured differential based on entered symptoms and clinical context.',
    audience: 'Clinicians reviewing decision-support signals',
  },
  {
    id: '2',
    name: 'Antibiotic Stewardship',
    description: 'Review antimicrobial considerations alongside allergy and patient context.',
    audience: 'Healthcare professionals supporting responsible antimicrobial use',
  },
  {
    id: '3',
    name: 'Rare Disease Explorer',
    description: 'Explore rare-disease reference information that may inform further clinical review.',
    audience: 'Clinicians and learners investigating uncommon conditions',
  },
];
