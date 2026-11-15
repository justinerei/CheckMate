type SectionPointsTransaction = {
  question: {
    updateMany(args: { where: { sectionId: string; type: { not: "ESSAY" } }; data: { points: number } }): PromiseLike<unknown>;
  };
};

export async function applySectionPoints(tx: SectionPointsTransaction, sectionId: string, points: number) {
  await tx.question.updateMany({ where: { sectionId, type: { not: "ESSAY" } }, data: { points } });
}
