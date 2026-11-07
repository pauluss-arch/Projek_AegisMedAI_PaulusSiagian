import { z } from 'zod';

export const medicalRecordNumSchema = z.string().regex(
  /^RM-\d{4}-\d{4}$/,
  'Format Nomor Rekam Medis harus RM-XXXX-XXXX (contoh: RM-2026-0101).',
);

export const patientFieldsSchema = z.object({
  medicalRecordNum: medicalRecordNumSchema,
  name: z.string().trim()
    .min(3, 'Nama harus terdiri dari minimal 3 karakter.')
    .max(100, 'Nama maksimal 100 karakter.'),
  age: z.number().int()
    .min(1, 'Usia minimal 1 tahun.')
    .max(120, 'Usia maksimal 120 tahun.'),
  gender: z.enum(['female', 'male', 'intersex', 'unknown']),
  eGFR: z.number()
    .min(5, 'eGFR minimal 5 mL/min.')
    .max(150, 'eGFR maksimal 150 mL/min.'),
  hasPenicillinAlg: z.boolean(),
});

export const diagnosisFieldsSchema = z.object({
  diseaseName: z.string().trim().min(1, 'Nama penyakit wajib diisi.').max(200),
  icdCode: z.string().trim().min(1, 'Kode ICD wajib diisi.').max(40),
  matchPercentage: z.number().min(0).max(100),
  isRareDisease: z.boolean(),
  symptoms: z.string().trim()
    .min(10, 'Gejala harus terdiri dari minimal 10 karakter.')
    .max(1000, 'Gejala maksimal 1000 karakter.'),
  prescribedDrug: z.string().trim().max(200).nullable(),
});

export const createPatientSchema = patientFieldsSchema.extend(diagnosisFieldsSchema.shape);

export const patientUpdateSchema = z.object({
  id: z.string().uuid('ID pasien tidak valid.'),
  eGFR: z.number().min(5, 'eGFR minimal 5 mL/min.').max(150, 'eGFR maksimal 150 mL/min.').optional(),
  hasPenicillinAlg: z.boolean().optional(),
}).refine(
  (value) => value.eGFR !== undefined || value.hasPenicillinAlg !== undefined,
  { message: 'Tidak ada perubahan data pasien yang diberikan.' },
);

export const recordDiagnosisSchema = diagnosisFieldsSchema.extend({
  patientId: z.string().uuid('ID pasien tidak valid.'),
  eGFR: z.number().min(5, 'eGFR minimal 5 mL/min.').max(150, 'eGFR maksimal 150 mL/min.'),
  hasPenicillinAlg: z.boolean(),
});

export const deletePatientSchema = z.string().uuid('ID pasien tidak valid.');
export const diagnosisIdSchema = z.string().uuid('ID diagnosis tidak valid.');

export const signDiagnosisSchema = z.object({
  diagnosisId: diagnosisIdSchema,
  diseaseName: z.string().trim().min(1).max(200),
  icdCode: z.string().trim().min(1).max(40),
  matchPercentage: z.number().min(0).max(100),
  isRareDisease: z.boolean(),
  prescribedDrug: z.string().trim().max(200).nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
