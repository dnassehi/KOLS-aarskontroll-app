-- Expand smoke status options for finer-grained documentation in KOLS annual review.
ALTER TYPE "SmokeStatus" ADD VALUE IF NOT EXISTS 'DAGLIG';
ALTER TYPE "SmokeStatus" ADD VALUE IF NOT EXISTS 'AV_OG_TIL';
ALTER TYPE "SmokeStatus" ADD VALUE IF NOT EXISTS 'UKJENT';
