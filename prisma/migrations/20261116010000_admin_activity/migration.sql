CREATE TABLE "AdminActivity" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminActivity_createdAt_idx" ON "AdminActivity"("createdAt");
CREATE INDEX "AdminActivity_targetId_createdAt_idx" ON "AdminActivity"("targetId", "createdAt");
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
