-- Added manually to support tenant-isolated patients
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

UPDATE "Patient"
SET "ownerId" = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "ownerId" IS NULL;

ALTER TABLE "Patient" ALTER COLUMN "ownerId" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Patient_ownerId_fkey'
  ) THEN
    ALTER TABLE "Patient" DROP CONSTRAINT "Patient_ownerId_fkey";
  END IF;
END $$;

ALTER TABLE "Patient"
  ADD CONSTRAINT "Patient_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Patient_patientCode_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_ownerId_patientCode_key" ON "Patient"("ownerId", "patientCode");
