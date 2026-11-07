-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "medicalRecordNum" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'unknown',
    "eGFR" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "hasPenicillinAlg" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisRecord" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "diseaseName" TEXT NOT NULL,
    "icdCode" TEXT NOT NULL,
    "matchPercentage" DOUBLE PRECISION NOT NULL,
    "isRareDisease" BOOLEAN NOT NULL DEFAULT false,
    "symptomsInput" TEXT NOT NULL,
    "prescribedDrug" TEXT,
    "digitalSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_medicalRecordNum_key" ON "Patient"("medicalRecordNum");

-- AddForeignKey
ALTER TABLE "DiagnosisRecord" ADD CONSTRAINT "DiagnosisRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
