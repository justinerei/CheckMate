"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { deletionBlocked } from "@/lib/deletion-policy";

export async function removeFromBatch(batchId: string, paperId?: string, expected?: { id: string; status: string }[]): Promise<{ error: string; quizId?: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  try {
    const result = await db.$transaction(async tx => {
      const locked = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(731828491) AS locked`;
      if (!locked[0]?.locked) return { error: "A page is currently being checked. Please try again when it finishes." };
      const batch = await tx.checkingBatch.findFirst({ where: { id: batchId, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, include: { submissions: { where: { teacherId: teacher.id, ...(paperId ? { id: paperId } : {}) }, include: { pages: true } } } });
      if (!batch || (paperId && batch.submissions.length !== 1)) return { error: "This paper or batch is unavailable." };
      if (!paperId && (!Array.isArray(expected) || expected.length !== batch.submissions.length || batch.submissions.some(paper => !expected.some(item => item.id === paper.id && item.status === paper.status)))) return { error: "The batch changed. Refresh and review its papers before deleting." };
      if (deletionBlocked(batch.submissions.flatMap(paper => paper.pages))) return { error: "A page is currently being checked. Please try again when it finishes." };
      const ids = batch.submissions.map(paper => paper.id);
      const photos = batch.submissions.flatMap(paper => paper.pages.map(page => ({ filePath: page.filePath })));
      if (photos.length) await tx.pendingPhotoDeletion.createMany({ data: photos, skipDuplicates: true });
      if (ids.length) {
        await tx.resultHistory.deleteMany({ where: { submissionId: { in: ids } } });
        await tx.submission.deleteMany({ where: { id: { in: ids }, teacherId: teacher.id, batchId } });
      }
      if (!paperId) await tx.checkingBatch.delete({ where: { id: batchId } });
      return { error: "", quizId: batch.quizId };
    }, { isolationLevel: "Serializable" });
    if (!result.error) {
      try { revalidatePath(`/batches/${batchId}`); revalidatePath(`/quizzes/${result.quizId}/overview`); revalidatePath("/submissions"); revalidatePath("/dashboard"); }
      catch { console.error("Batch deletion succeeded, but page refresh failed."); }
    }
    return result;
  } catch (error) { console.error("Batch deletion transaction failed:", error instanceof Error ? error.name : "UnknownError"); return { error: "Could not remove this item. Refresh and try again." }; }
}
