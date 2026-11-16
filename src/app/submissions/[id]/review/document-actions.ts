"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { documentNeedsReview, documentReviewed, parseExtraction } from "@/lib/extraction";
import type { Prisma } from "@/generated/prisma/client";

export async function confirmPaperPage(submissionId: string, pageId: string, _state: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher();
  if (!teacher) return { message: "Please sign in again.", ok: false };
  if (form.get("checked") !== "on") return { message: "Check the photo and confirm it belongs to this quiz and student.", ok: false };
  try {
    const result = await db.$transaction(async tx => {
      const page = await tx.submissionPage.findFirst({ where: { id: pageId, submissionId, status: "COMPLETE", submission: { teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id } } }, select: { extraction: true } });
      if (!page?.extraction || typeof page.extraction !== "object" || Array.isArray(page.extraction)) return false;
      const parsed = parseExtraction(JSON.stringify(page.extraction));
      if (!parsed || !documentNeedsReview(parsed.document) || documentReviewed(page.extraction)) return false;
      const extraction = { ...page.extraction, documentReview: { confirmed: true, teacherId: teacher.id, reviewedAt: new Date().toISOString() } } as unknown as Prisma.InputJsonObject;
      await tx.submissionPage.update({ where: { id: pageId }, data: { extraction } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!result) return { message: "This page changed or is no longer available. Refresh and check it again.", ok: false };
    revalidatePath(`/submissions/${submissionId}/review`);
    revalidatePath(`/submissions/${submissionId}`);
    revalidatePath("/batches/[id]", "page");
    revalidatePath("/quizzes/[id]/overview", "page");
    return { message: "Page confirmed.", ok: true };
  } catch { return { message: "Could not confirm this page. Refresh and try again.", ok: false }; }
}
