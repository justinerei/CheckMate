ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

ALTER TABLE "Student" ADD COLUMN "accountId" TEXT;
ALTER TABLE "Submission" ADD COLUMN "releasedAt" TIMESTAMP(3);

CREATE TABLE "StudentInvite" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Student_accountId_key" ON "Student"("accountId");
CREATE UNIQUE INDEX "StudentInvite_tokenHash_key" ON "StudentInvite"("tokenHash");
CREATE INDEX "StudentInvite_studentId_idx" ON "StudentInvite"("studentId");
ALTER TABLE "Student" ADD CONSTRAINT "Student_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentInvite" ADD CONSTRAINT "StudentInvite_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
