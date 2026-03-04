-- AlterTable
ALTER TABLE "AnnualReview"
ADD COLUMN     "receivesPhysiotherapy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRehabYear" INTEGER;
