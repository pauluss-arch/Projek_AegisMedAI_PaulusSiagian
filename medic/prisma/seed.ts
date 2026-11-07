import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { diseases } from '../src/mock/diseasesData.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be configured before running the Prisma seed.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  for (const disease of diseases) {
    const data = JSON.parse(JSON.stringify(disease)) as Prisma.InputJsonValue;
    await prisma.diseaseCatalogItem.upsert({
      where: { id: disease.id },
      update: {
        name: disease.name,
        category: disease.category,
        icd11: disease.icd11,
        rare: disease.rare,
        data,
      },
      create: {
        id: disease.id,
        name: disease.name,
        category: disease.category,
        icd11: disease.icd11,
        rare: disease.rare,
        data,
      },
    });
  }

  await prisma.patient.upsert({
    where: { medicalRecordNum: 'RM-2026-0101' },
    update: {},
    create: {
      medicalRecordNum: 'RM-2026-0101',
      name: 'PAT-DEMO-SEED-ONLY',
      age: 42,
      gender: 'unknown',
      eGFR: 90,
      hasPenicillinAlg: false,
      diagnoses: {
        create: {
          diseaseName: 'Demo assessment — clinician review required',
          icdCode: 'UNVERIFIED',
          matchPercentage: 0,
          isRareDisease: false,
          symptomsInput: 'Synthetic seed record. No real patient information.',
        },
      },
    },
  });
} finally {
  await prisma.$disconnect();
}
