CREATE TABLE "CheckingBatch" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckingBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Submission" ADD COLUMN "batchId" TEXT;
CREATE INDEX "CheckingBatch_teacherId_createdAt_idx" ON "CheckingBatch"("teacherId", "createdAt");
ALTER TABLE "CheckingBatch" ADD CONSTRAINT "CheckingBatch_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckingBatch" ADD CONSTRAINT "CheckingBatch_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CheckingBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
