-- CreateEnum
CREATE TYPE "SmokeStatus" AS ENUM ('ALDRI', 'TIDLIGERE', 'NAVAERENDE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "patientCode" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualReview" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reviewYear" INTEGER NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "catScore" INTEGER,
    "mmrc" INTEGER,
    "exacerbationsLast12m" INTEGER,
    "hospitalizationsLast12m" INTEGER,
    "fev1L" DOUBLE PRECISION,
    "fev1PercentPred" DOUBLE PRECISION,
    "fvcL" DOUBLE PRECISION,
    "fev1Fvc" DOUBLE PRECISION,
    "spo2" DOUBLE PRECISION,
    "eosinophils" DOUBLE PRECISION,
    "smokeStatus" "SmokeStatus",
    "packYears" DOUBLE PRECISION,
    "medLaba" BOOLEAN NOT NULL DEFAULT false,
    "medLama" BOOLEAN NOT NULL DEFAULT false,
    "medIcs" BOOLEAN NOT NULL DEFAULT false,
    "medSama" BOOLEAN NOT NULL DEFAULT false,
    "medSaba" BOOLEAN NOT NULL DEFAULT false,
    "medPde4" BOOLEAN NOT NULL DEFAULT false,
    "influenzaDate" TIMESTAMP(3),
    "pneumococcalDate" TIMESTAMP(3),
    "covidDate" TIMESTAMP(3),
    "rsvDate" TIMESTAMP(3),
    "obstructionGrade" TEXT,
    "symptomBurden" TEXT,
    "riskLevel" TEXT,
    "treatmentStepSuggestion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualReview_patientId_reviewYear_key" ON "AnnualReview"("patientId", "reviewYear");

-- AddForeignKey
ALTER TABLE "AnnualReview" ADD CONSTRAINT "AnnualReview_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReview" ADD CONSTRAINT "AnnualReview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
