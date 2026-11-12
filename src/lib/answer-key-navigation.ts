export function answerKeyReturnPath(id: string, fromChecking: boolean) {
  const encoded = encodeURIComponent(id);
  return fromChecking ? `/submissions/new?quizId=${encoded}&saved=1` : `/quizzes/existing/${encoded}?saved=1`;
}
