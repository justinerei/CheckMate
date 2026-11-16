ALTER TABLE "Submission" ADD COLUMN "showCorrectAnswers" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "ResultConcern" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "response" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResultConcern_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ResultConcern_submissionId_createdAt_idx" ON "ResultConcern"("submissionId", "createdAt");
ALTER TABLE "ResultConcern" ADD CONSTRAINT "ResultConcern_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
