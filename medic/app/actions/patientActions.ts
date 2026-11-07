'use server';

import { createHmac, randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import db from '../../lib/db';
import { bacaSesi } from '../../lib/sesi';
import type { PersistedPatient } from '../../src/types';
import {
  createPatientSchema,
  deletePatientSchema,
  patientUpdateSchema,
  recordDiagnosisSchema,
  signDiagnosisSchema,
} from '../../src/lib/validations/patient';

type PatientWithDiagnoses = Prisma.PatientGetPayload<{
  include: { diagnoses: { orderBy: { createdAt: 'desc' } } };
}>;
type FieldErrors = Record<string, string[] | undefined>;

export type PatientActionResult =
  | { success: true; patient: PersistedPatient }
  | { success: false; message: string; fieldErrors?: FieldErrors };

export type MutationResult =
  | { success: true }
  | { success: false; message: string; fieldErrors?: FieldErrors };

export type SignDiagnosisResult =
  | { success: true; patientId: string; diagnosis: PersistedPatient['diagnoses'][number] }
  | { success: false; message: string; fieldErrors?: FieldErrors };

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 bytes before saving patient records.');
  }
  return secret;
}

function pseudonymizeName(name: string): string {
  const normalized = name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const digest = createHmac('sha256', requireSecret()).update(normalized).digest('hex');
  return `PAT-${digest}`;
}

function normalizeGender(value: string): PersistedPatient['gender'] {
  return value === 'female' || value === 'male' || value === 'intersex' ? value : 'unknown';
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

function revalidatePatientPages(): void {
  revalidatePath('/');
  revalidatePath('/clinical-tools');
  revalidatePath('/assessments/[id]', 'page');
}

function generatedMedicalRecordNum(): string {
  return `RM-${new Date().getFullYear()}-${randomInt(0, 10_000).toString().padStart(4, '0')}`;
}

export async function getPatients(): Promise<PersistedPatient[]> {
  const sesi = await bacaSesi();
  if (!sesi) {
    throw new Error('A valid session is required to read patient records.');
  }
  if (sesi.peran === 'pasien') {
    throw new Error('Akses ditolak (403 Forbidden): Pasien tidak diizinkan mengakses daftar seluruh rekam medis.');
  }

  const patients = await db.patient.findMany({
    include: { diagnoses: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return patients.map(toPatientRecord);
}

export async function getPatientById(input: unknown): Promise<PersistedPatient | null> {
  const sesi = await bacaSesi();
  if (!sesi) {
    throw new Error('A valid session is required to read patient records.');
  }
  const parsed = deletePatientSchema.safeParse(input);
  if (!parsed.success) return null;

  const patient = await db.patient.findUnique({
    where: { id: parsed.data },
    include: { diagnoses: { orderBy: { createdAt: 'desc' } } },
  });
  if (!patient) return null;

  // Proteksi IDOR (Insecure Direct Object Reference - R01/T06):
  // Peran pasien HANYA boleh mengakses data rekam medis miliknya sendiri
  if (sesi.peran === 'pasien') {
    const isOwner = sesi.pasienId === patient.medicalRecordNum || sesi.pasienId === patient.id;
    if (!isOwner) {
      throw new Error('Akses ditolak (403 Forbidden - IDOR): Anda tidak memiliki izin untuk melihat rekam medis pasien lain.');
    }
  }

  return toPatientRecord(patient);
}

export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  const sesi = await bacaSesi();
  if (!sesi) {
    return { success: false, message: 'Your session has expired. Sign in again before saving patient records.' };
  }
  if (sesi.peran !== 'dokter' && sesi.peran !== 'admin') {
    return { success: false, message: `Akses ditolak (403 Forbidden): Peran '${sesi.peran}' tidak berwenang mendaftarkan rekam medis pasien baru.` };
  }

  const suppliedRecordNum = typeof input === 'object' && input !== null
    && 'medicalRecordNum' in input && typeof input.medicalRecordNum === 'string';
  const candidate = suppliedRecordNum
    ? input
    : typeof input === 'object' && input !== null
      ? { ...input, medicalRecordNum: generatedMedicalRecordNum() }
      : input;
  const parsed = createPatientSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali data pasien dan gejala yang dimasukkan.',
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { medicalRecordNum, name, age, gender, eGFR, hasPenicillinAlg, ...diagnosis } = parsed.data;
  const attempts = suppliedRecordNum ? 1 : 3;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const recordNum = attempt === 0 ? medicalRecordNum : generatedMedicalRecordNum();
    try {
      const patient = await db.$transaction((transaction) =>
        transaction.patient.create({
          data: {
            medicalRecordNum: recordNum,
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
        if (!suppliedRecordNum && attempt + 1 < attempts) continue;
        return {
          success: false,
          message: 'Nomor rekam medis sudah digunakan. Coba simpan kembali.',
          fieldErrors: { medicalRecordNum: ['Nomor rekam medis sudah digunakan.'] },
        };
      }
      throw error;
    }
  }

  throw new Error('A unique medical record number could not be generated.');
}

function zodFieldErrors(error: {
  flatten: () => { fieldErrors: FieldErrors };
}): FieldErrors {
  return error.flatten().fieldErrors;
}

export async function recordDiagnosisAction(input: unknown): Promise<PatientActionResult> {
  const sesi = await bacaSesi();
  if (!sesi) {
    return { success: false, message: 'Your session has expired. Sign in again before saving the assessment.' };
  }
  if (sesi.peran !== 'dokter') {
    return { success: false, message: `Akses ditolak (403 Forbidden): Peran '${sesi.peran}' tidak berwenang melakukan diagnosis medis. Hanya dokter berlisensi yang berwenang.` };
  }
  const parsed = recordDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali gejala dan data keselamatan pasien.',
      fieldErrors: zodFieldErrors(parsed.error),
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
  const sesi = await bacaSesi();
  if (!sesi) {
    return { success: false, message: 'Your session has expired. Sign in again before updating patient records.' };
  }
  if (sesi.peran === 'pasien') {
    return { success: false, message: 'Akses ditolak (403 Forbidden): Pasien tidak diizinkan mengubah status klinis atau keselamatan rekam medis.' };
  }
  const parsed = patientUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali nilai eGFR dan status alergi.',
      fieldErrors: zodFieldErrors(parsed.error),
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

export async function deletePatientAction(input: unknown): Promise<MutationResult> {
  const sesi = await bacaSesi();
  if (!sesi) {
    return { success: false, message: 'Your session has expired. Sign in again before deleting patient records.' };
  }
  if (sesi.peran !== 'admin') {
    return { success: false, message: `Akses ditolak (403 Forbidden): Peran '${sesi.peran}' tidak berwenang menghapus rekam medis. Hanya admin sistem yang berwenang.` };
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
  const sesi = await bacaSesi();
  if (!sesi) {
    return { success: false, message: 'Your session has expired. Sign in again before recording the demo signature.' };
  }
  if (sesi.peran !== 'dokter') {
    return { success: false, message: `Akses ditolak (403 Forbidden): Peran '${sesi.peran}' tidak berwenang menandatangani resep medis. Hanya dokter yang berwenang.` };
  }
  const parsed = signDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Periksa kembali data diagnosis yang akan ditandatangani.',
      fieldErrors: zodFieldErrors(parsed.error),
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

      const payload = JSON.stringify({
        version: 1,
        diagnosisId: existing.id,
        patientId: existing.patientId,
        recordedAt: existing.createdAt.toISOString(),
        signedAt: signedAt.toISOString(),
        ...diagnosisInput,
      });
      const signature = `demo-hmac-sha256:v1:${signedAt.toISOString()}:${createHmac('sha256', secret)
        .update(`aegismed-demo-prescription:v1\0${payload}`)
        .digest('hex')}`;
      const updated = await transaction.diagnosisRecord.update({
        where: { id: diagnosisId },
        data: { ...diagnosisInput, digitalSignature: signature },
      });
      return { patientId: existing.patientId, diagnosis: updated };
    });

    if (!diagnosis) {
      return { success: false, message: 'Diagnosis record was not found. Refresh the page and try again.' };
    }
    revalidatePatientPages();
    return {
      success: true,
      patientId: diagnosis.patientId,
      diagnosis: {
        id: diagnosis.diagnosis.id,
        diseaseName: diagnosis.diagnosis.diseaseName,
        icdCode: diagnosis.diagnosis.icdCode,
        matchPercentage: diagnosis.diagnosis.matchPercentage,
        isRareDisease: diagnosis.diagnosis.isRareDisease,
        prescribedDrug: diagnosis.diagnosis.prescribedDrug,
        digitalSignature: diagnosis.diagnosis.digitalSignature,
        createdAt: diagnosis.diagnosis.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return { success: false, message: 'Diagnosis record was not found. Refresh the page and try again.' };
    }
    throw error;
  }
}
