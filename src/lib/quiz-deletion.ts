import type { Prisma } from "../generated/prisma/client";

type QuizDeleteClient = { quiz: { deleteMany(args: { where: Prisma.QuizWhereInput }): Promise<{ count: number }> } };
type QuizArchiveClient = { quiz: { updateMany(args: { where: Prisma.QuizWhereInput; data: Prisma.QuizUpdateManyMutationInput }): Promise<{ count: number }> } };

export async function updateQuizArchiveState(tx: QuizArchiveClient, quizId: string, teacherId: string, archived: boolean) {
  const result = await tx.quiz.updateMany({ where: { id: quizId, teacherId, archivedAt: archived ? null : { not: null } }, data: { archivedAt: archived ? new Date() : null } });
  return result.count === 1;
}

export async function removeQuizIfEmpty(tx: QuizDeleteClient, quizId: string, teacherId: string) {
  const result = await tx.quiz.deleteMany({ where: {
    id: quizId, teacherId,
    submissions: { none: {} },
    batches: { none: {} },
    sections: { none: { questions: { some: { answerKey: { is: { history: { some: {} } } } } } } },
  } });
  return result.count === 1;
}
