export function requiresUnmatchedReview(count: number, questions: { id: string }[], answers: { questionId: string; reviewStatus: string; confirmedText: string | null }[]) {
  return count > 0 && !questions.every(question => answers.some(answer => answer.questionId === question.id && answer.reviewStatus === "CONFIRMED" && answer.confirmedText !== null));
}
