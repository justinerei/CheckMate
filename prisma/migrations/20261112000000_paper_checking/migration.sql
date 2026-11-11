ALTER TABLE "Submission" ALTER COLUMN "studentId" DROP NOT NULL;
ALTER TABLE "Submission" ADD COLUMN "paperName" TEXT;
ALTER TABLE "Submission" ADD COLUMN "nameReviewed" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Submission" SET "nameReviewed" = true WHERE "studentId" IS NOT NULL;
