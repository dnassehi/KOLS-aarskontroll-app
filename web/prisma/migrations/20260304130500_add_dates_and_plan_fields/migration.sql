-- AlterTable
ALTER TABLE "AnnualReview"
ADD COLUMN     "chestXrayMonth" INTEGER,
ADD COLUMN     "spirometryDate" TIMESTAMP(3),
ADD COLUMN     "planOrTiltak" TEXT;
