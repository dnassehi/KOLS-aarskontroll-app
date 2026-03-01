-- AlterTable
ALTER TABLE "AnnualReview"
ADD COLUMN     "smokingActive" BOOLEAN,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "weightKg" DOUBLE PRECISION,
ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "chestXrayYear" INTEGER,
ADD COLUMN     "comorbCvd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "comorbKidneyDisease" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "comorbDiabetesMetSyn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "comorbOsteoporosis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "comorbAnxietyDepression" BOOLEAN NOT NULL DEFAULT false;
