ALTER TABLE "SubmissionPage"
  ADD COLUMN "extraction" JSONB,
  ADD COLUMN "extractionModel" TEXT,
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "processingToken" TEXT,
  ADD COLUMN "retryAt" TIMESTAMP(3);
