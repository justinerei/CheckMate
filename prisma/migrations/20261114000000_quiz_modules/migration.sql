CREATE TABLE "QuizModule" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pages" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizModule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuizModule_quizId_createdAt_idx" ON "QuizModule"("quizId", "createdAt");
ALTER TABLE "QuizModule" ADD CONSTRAINT "QuizModule_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Question" ADD COLUMN "sourceModuleName" TEXT, ADD COLUMN "sourcePage" INTEGER;
