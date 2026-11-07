import { z } from 'zod';

const allergyKeySchema = z.enum(['penicillin', 'sulfa', 'macrolide']);
const therapySchema = z.object({
  id: z.string(),
  name: z.string(),
  className: z.string(),
  status: z.enum(['First-line example', 'Alternative example', 'Specialist therapy']),
  allergyRisks: z.array(allergyKeySchema),
  contraindications: z.array(allergyKeySchema),
  baseDose: z.string(),
  renalDoseBelow30: z.string().optional(),
  dosage: z.string(),
  egfrAdjustments: z.array(z.object({
    below: z.number(),
    guidance: z.string(),
  })),
  note: z.string(),
});

export const diseaseRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  icd11: z.string(),
  icd11Code: z.string(),
  icd11Verified: z.boolean(),
  keywords: z.array(z.string()),
  symptoms: z.array(z.string()),
  symptomSignals: z.array(z.string()),
  summary: z.string(),
  homeCare: z.array(z.string()),
  redFlags: z.array(z.string()),
  careNote: z.string(),
  rare: z.boolean(),
  therapies: z.array(therapySchema),
  recommendedAntibiotics: z.array(therapySchema),
});
