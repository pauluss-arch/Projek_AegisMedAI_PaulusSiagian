'use server';

import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import db from '../../lib/db';
import { bacaSesi } from '../../lib/sesi';
import type { PersistedDiagnosisRecord, PersistedPatient } from '../../src/types';
import {
  createPatientSchema,
  deletePatientSchema,
  diagnosisIdSchema,
  patientUpdateSchema,
  recordDiagnosisSchema,
  signDiagnosisSchema,
} from '../../src/lib/validations/patient';

type PatientWithDiagnoses = Prisma.PatientGetPayload<{ include: { diagnoses: true } }>;
type FieldErrors = Record<string, string[] | undefined>;

export type PatientActionResult =
  | { success: true; patient: PersistedPatient }
  | { success: false; message: string; fieldErrors?: FieldErrors };

export type SignDiagnosisResult =
  | { success: true; diagnosis: PersistedPatient['diagnoses'][number] }
  | { success: false; message: string; fieldErrors?: FieldErrors };

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 bytes before saving patient records.');
  }
  return secret;
}

function pseudonymizeName(name: string): string {
  const digest = createHmac('sha256', requireSecret())
    .update(name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase())
    .digest('hex');
  return `PAT-${digest}`;
}

function normalizeGender(value: string): PersistedPatient['gender'] {
  if (value === 'female' || value === 'male' || value === 'intersex') return value;
  return 'unknown';
}

function toPatientRecord(patient: PatientWithDiagnoses): PersistedPatient {
  return {
    id: patient.id,
    medicalRecordNum: patient.medicalRecordNum,
    name: patient.name,
    age: patient.age,
    gender: normalizeGender(patient.gender),
    eGFR: patient.eGFR,
    hasPenicillinAlg: patient.hasPenicillinAlg,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
    diagnoses: patient.diagnoses.map((diagnosis) => ({
      id: diagnosis.id,
      diseaseName: diagnosis.diseaseName,
      icdCode: diagnosis.icdCode,
      matchPercentage: diagnosis.matchPercentage,
      isRareDisease: diagnosis.isRareDisease,
      prescribedDrug: diagnosis.prescribedDrug,
      digitalSignature: diagnosis.digitalSignature,
      createdAt: diagnosis.createdAt.toISOString(),
    })),
  };
}

function fieldErrors(error: { flatten: () => { fieldErrors: FieldErrors } }): FieldErrors {
  return error.flatten().fieldErrors;
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

async function requireSession(): Promise<boolean> {
  return Boolean(await bacaSesi());
}

export async function getPatients(): Promise<PersistedPatient[]> {
  if (!(await requireSession())) {
    throw new Error('A valid session is required to read patient records.');
  }

  try {
    if (db?.patient?.findMany) {
      const patients = await db.patient.findMany({
        include: { diagnoses: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      });
      return patients.map(toPatientRecord);
    }
  } catch (error) {
    console.error('Failed to read patients from database:', error);
  }

  return [];
}

export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  if (!(await requireSession())) {
    return { success: false, message: 'Your session has expired. Sign in again before saving patient records.' };
  }

  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali data pasien dan gejala yang dimasukkan.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { medicalRecordNum, name, age, gender, eGFR, hasPenicillinAlg, ...diagnosis } = parsed.data;
  try {
    const patient = await db.$transaction((transaction) =>
      transaction.patient.create({
        data: {
          medicalRecordNum,
          name: pseudonymizeName(name),
          age,
          gender,
          eGFR,
          hasPenicillinAlg,
          diagnoses: {
            create: {
              diseaseName: diagnosis.diseaseName,
              icdCode: diagnosis.icdCode,
              matchPercentage: diagnosis.matchPercentage,
              isRareDisease: diagnosis.isRareDisease,
              symptomsInput: diagnosis.symptoms,
              prescribedDrug: diagnosis.prescribedDrug,
            },
          },
        },
        include: { diagnoses: { orderBy: { createdAt: 'desc' } } },
      }),
    );

    revalidatePatientPages();
    return { success: true, patient: toPatientRecord(patient) };
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return {
        success: false,
        message: 'Nomor rekam medis sudah digunakan. Pilih nomor yang berbeda.',
        fieldErrors: { medicalRecordNum: ['Nomor rekam medis sudah digunakan.'] },
      };
    }
    throw error;
  }
}

export async function recordDiagnosisAction(input: unknown): Promise<PatientActionResult> {
  if (!(await requireSession())) {
    return { success: false, message: 'Your session has expired. Sign in again before saving patient records.' };
  }

  const parsed = recordDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali gejala dan data keselamatan pasien.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { patientId, eGFR, hasPenicillinAlg, ...diagnosis } = parsed.data;
  try {
    const patient = await db.$transaction((transaction) =>
      transaction.patient.update({
        where: { id: patientId },
        data: {
          eGFR,
          hasPenicillinAlg,
          diagnoses: {
            create: {
              diseaseName: diagnosis.diseaseName,
              icdCode: diagnosis.icdCode,
              matchPercentage: diagnosis.matchPercentage,
              isRareDisease: diagnosis.isRareDisease,
              symptomsInput: diagnosis.symptoms,
              prescribedDrug: diagnosis.prescribedDrug,
            },
          },
        },
        include: { diagnoses: { orderBy: { createdAt: 'desc' } } },
      }),
    );

    revalidatePatientPages();
    return { success: true, patient: toPatientRecord(patient) };
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return { success: false, message: 'Patient record was not found. Refresh the page and try again.' };
    }
    throw error;
  }
}

export async function updatePatientAction(input: unknown): Promise<PatientActionResult> {
  if (!(await requireSession())) {
    return { success: false, message: 'Your session has expired. Sign in again before updating patient records.' };
  }

  const parsed = patientUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali nilai eGFR dan status alergi.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { id, ...data } = parsed.data;
  try {
    const patient = await db.patient.update({
      where: { id },
      data,
      include: { diagnoses: { orderBy: { createdAt: 'desc' } } },
    });

    revalidatePatientPages();
    return { success: true, patient: toPatientRecord(patient) };
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return { success: false, message: 'Patient record was not found. Refresh the page and try again.' };
    }
    throw error;
  }
}

export async function deletePatientAction(input: unknown): Promise<{ success: boolean; message?: string }> {
  if (!(await requireSession())) {
    return { success: false, message: 'Your session has expired. Sign in again before deleting patient records.' };
  }

  const parsed = deletePatientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Patient ID is invalid.' };
  }

  try {
    await db.patient.delete({ where: { id: parsed.data } });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return { success: false, message: 'Patient record was not found. Refresh the page and try again.' };
    }
    throw error;
  }

  revalidatePatientPages();
  return { success: true };
}

export async function signDiagnosisAction(input: unknown): Promise<SignDiagnosisResult> {
  if (!(await requireSession())) {
    return { success: false, message: 'Your session has expired. Sign in again before confirming a signature demonstration.' };
  }

  const parsed = signDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali data diagnosis yang akan ditandatangani.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { diagnosisId, ...diagnosisInput } = parsed.data;
  const signedAt = new Date();
  const secret = requireSecret();

  try {
    const diagnosis = await db.$transaction(async (transaction) => {
      const existing = await transaction.diagnosisRecord.findUnique({
        where: { id: diagnosisId },
        select: { id: true, patientId: true, createdAt: true },
      });
      if (!existing) return null;

      const signaturePayload = JSON.stringify({
        version: 1,
        diagnosisId: existing.id,
        patientId: existing.patientId,
        recordedAt: existing.createdAt.toISOString(),
        signedAt: signedAt.toISOString(),
        ...diagnosisInput,
      });
      const signature = `demo-hmac-sha256:v1:${signedAt.toISOString()}:${createHmac('sha256', secret)
        .update(`aegismed-demo-prescription:v1\0${signaturePayload}`)
        .digest('hex')}`;

      return transaction.diagnosisRecord.update({
        where: { id: diagnosisId },
        data: { ...diagnosisInput, digitalSignature: signature },
      });
    });

    if (!diagnosis) {
      return { success: false, message: 'Diagnosis record was not found. Refresh the page and try again.' };
    }

    revalidatePatientPages();
    return {
      success: true,
      diagnosis: {
        id: diagnosis.id,
        diseaseName: diagnosis.diseaseName,
        icdCode: diagnosis.icdCode,
        matchPercentage: diagnosis.matchPercentage,
        isRareDisease: diagnosis.isRareDisease,
        prescribedDrug: diagnosis.prescribedDrug,
        digitalSignature: diagnosis.digitalSignature,
        createdAt: diagnosis.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return { success: false, message: 'Diagnosis record was not found. Refresh the page and try again.' };
    }
    throw error;
  }
}

export async function getDiagnosisRecord(input: unknown): Promise<PersistedDiagnosisRecord | null> {
  if (!(await requireSession())) {
    throw new Error('A valid session is required to read diagnosis records.');
  }

  const parsed = diagnosisIdSchema.safeParse(input);
  if (!parsed.success) return null;

  const diagnosis = await db.diagnosisRecord.findUnique({
    where: { id: parsed.data },
    include: { patient: { select: { medicalRecordNum: true } } },
  });
  if (!diagnosis) return null;

  return {
    id: diagnosis.id,
    diseaseName: diagnosis.diseaseName,
    icdCode: diagnosis.icdCode,
    matchPercentage: diagnosis.matchPercentage,
    isRareDisease: diagnosis.isRareDisease,
    prescribedDrug: diagnosis.prescribedDrug,
    digitalSignature: diagnosis.digitalSignature,
    createdAt: diagnosis.createdAt.toISOString(),
    symptomsInput: diagnosis.symptomsInput,
    patientMedicalRecordNum: diagnosis.patient.medicalRecordNum,
  };
}

function revalidatePatientPages(): void {
  revalidatePath('/');
  revalidatePath('/clinical-tools');
  revalidatePath('/assessments/[id]', 'page');
}
