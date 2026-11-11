"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { pagesComplete, validPageCount } from "@/lib/submission-upload";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CreateState = { error: string; existingId?: string };

export async function createSubmission(_previous: CreateState, form: FormData): Promise<CreateState> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const quizId = form.get("quizId");
  const expectedPages = validPageCount(String(form.get("expectedPages") ?? ""));
  if (typeof quizId !== "string" || !expectedPages) return { error: "Choose a quiz and 1 to 10 pages." };
  const quiz = await db.quiz.findFirst({ where: { id: quizId, teacherId: teacher.id }, select: { id: true } });
  if (!quiz) return { error: "Choose a quiz from your list." };
  let id: string;
  try { const submission = await db.submission.create({ data: { quizId, teacherId: teacher.id, expectedPages }, select: { id: true } }); id = submission.id; }
  catch { return { error: "Could not create the paper. Please try again." }; }
  revalidatePath("/submissions");
  redirect(`/submissions/${id}`);
}

export async function confirmSubmission(submissionId: string): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  try {
    const result = await db.$transaction(async tx => {
      const item = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" }, select: { expectedPages: true, pages: { select: { pageNumber: true } } } });
      if (!item || !pagesComplete(item.expectedPages, item.pages.map(p => p.pageNumber))) return false;
      const updated = await tx.submission.updateMany({ where: { id: submissionId, teacherId: teacher.id, status: "DRAFT" }, data: { status: "IN_REVIEW" } });
      return updated.count === 1;
    }, { isolationLevel: "Serializable" });
    if (!result) return { error: "Upload every page in the correct order before confirming." };
  } catch { return { error: "Could not confirm the pages. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/submissions");
  return { error: "" };
}

export async function reopenSubmission(submissionId: string): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  try {
    const result = await db.submission.updateMany({ where: { id: submissionId, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "IN_REVIEW", finalizedAt: null, objectiveScore: null, essayScore: null, totalScore: null, answers: { none: {} }, pages: { none: { status: { in: ["PROCESSING", "COMPLETE"] } } } }, data: { status: "DRAFT" } });
    if (result.count !== 1) return { error: "This submission can no longer be reopened for page changes." };
  } catch { return { error: "Could not reopen the submission. Please try again." }; }
  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/submissions");
  return { error: "" };
}

export async function updateExpectedPages(submissionId: string, value: string): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const count = validPageCount(value);
  if (!count) return { error: "Enter a page count from 1 to 10." };
  try {
    const result = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" }, select: { pages: { select: { pageNumber: true } } } });
      if (!submission) return "This submission is unavailable or already confirmed.";
      if (submission.pages.some(page => page.pageNumber > count)) return "Remove photos beyond the new page count first.";
      await tx.submission.update({ where: { id: submissionId }, data: { expectedPages: count } });
      return "";
    }, { isolationLevel: "Serializable" });
    if (result) return { error: result };
  } catch { return { error: "Could not update the page count. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}`);
  return { error: "" };
}
