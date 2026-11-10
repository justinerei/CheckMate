-- Existing drafts remain null until the teacher supplies an expected page count.
ALTER TABLE "Submission" ADD COLUMN "expectedPages" INTEGER;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_expectedPages_check"
  CHECK ("expectedPages" IS NULL OR "expectedPages" BETWEEN 1 AND 10);
