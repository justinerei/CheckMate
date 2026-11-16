ALTER TABLE "Submission" ADD COLUMN "classroomId" TEXT;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Submission_classroomId_idx" ON "Submission"("classroomId");
