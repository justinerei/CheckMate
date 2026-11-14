export function studentLinkProblem(paperAvailable: boolean, studentAllowed: boolean, duplicate: boolean): string | null {
  if (!paperAvailable) return "This paper is unavailable or already finalized. Reopen it before changing its student.";
  if (!studentAllowed) return "Choose a student from your student list.";
  if (duplicate) return "This student already has a paper for this quiz.";
  return null;
}
