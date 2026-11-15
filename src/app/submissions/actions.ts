"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { pagesComplete, validPageCount } from "@/lib/submission-upload";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { questionIsComplete } from "@/lib/quiz-outline";
import { canAddPaper, nextBatchPaperError, validBatchPageCount } from "@/lib/batch-policy";

export type CreateState = { error: string; existingId?: string };

export async function createSubmission(_previous: CreateState, form: FormData): Promise<CreateState> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const quizId = form.get("quizId");
  const expectedPages = validPageCount(String(form.get("expectedPages") ?? ""));
  if (typeof quizId !== "string" || !expectedPages || !validBatchPageCount(expectedPages)) return { error: "Choose a quiz and 1 to 3 pages." };
  const quiz = await db.quiz.findFirst({ where: { id: quizId, teacherId: teacher.id }, select: { id: true, sections: { select: { questions: { select: { text: true, type: true, answerKey: { select: { acceptedAnswers: true } }, rubricCriteria: { select: { id: true } } } } } } } });
  if (!quiz) return { error: "Choose a quiz from your list." };
  const questions = quiz.sections.flatMap(section => section.questions);
  if (!questions.length || questions.some(question => !questionIsComplete(question))) return { error: "Complete the quiz questions, answer keys, and essay rubrics before checking papers." };
  let id: string;
  try { const submission = await db.$transaction(async tx => { const batch = await tx.checkingBatch.create({ data: { quizId, teacherId: teacher.id } }); return tx.submission.create({ data: { quizId, teacherId: teacher.id, expectedPages, batchId: batch.id }, select: { id: true } }); }); id = submission.id; }
  catch { return { error: "Could not create the paper. Please try again." }; }
  revalidatePath("/submissions");
  redirect(`/submissions/${id}`);
}

export async function addBatchPaper(batchId: string, _previous: CreateState, form: FormData): Promise<CreateState> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const expectedPages = Number(form.get("expectedPages"));
  if (!validBatchPageCount(expectedPages)) return { error: "Choose 1 to 3 pages." };
  let id: string;
  try {
    const result = await db.$transaction(async tx => {
      const batch = await tx.checkingBatch.findFirst({ where: { id: batchId, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, include: { _count: { select: { submissions: true } } } });
      if (!batch || !canAddPaper(batch._count.submissions)) return null;
      return tx.submission.create({ data: { teacherId: teacher.id, quizId: batch.quizId, batchId, expectedPages }, select: { id: true } });
    }, { isolationLevel: "Serializable" });
    if (!result) return { error: "This batch is unavailable or already has five papers." };
    id = result.id;
  } catch { return { error: "Could not add the paper. Refresh and try again." }; }
  redirect(`/submissions/${id}`);
}

export async function retryBatchPage(submissionId: string, pageId: string): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  const result = await db.submissionPage.updateMany({ where: { id: pageId, submissionId, status: "FAILED", retryAt: null, submission: { batchId: { not: null }, status: "IN_REVIEW", teacherId: teacher.id, quiz: { teacherId: teacher.id } } }, data: { status: "PENDING", error: null } });
  return { error: result.count ? "" : "This page is not ready to retry." };
}

/** Start a fresh paper only from a finalized paper owned by this teacher. */
export async function createNextPaper(previousId: string, _previous: CreateState): Promise<CreateState> {
  void _previous;
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const previous = await db.submission.findFirst({ where: { id: previousId, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "FINALIZED" }, select: { quizId: true, expectedPages: true } });
  if (!previous || !validPageCount(String(previous.expectedPages ?? ""))) return { error: "This paper cannot be reused. Start a new paper from the dashboard." };
  let id: string;
  try {
    const next = await db.submission.create({ data: { quizId: previous.quizId, teacherId: teacher.id, expectedPages: previous.expectedPages }, select: { id: true } });
    id = next.id;
  } catch { return { error: "Could not start the next paper. Please try again." }; }
  revalidatePath("/submissions");
  redirect(`/submissions/${id}?camera=1`);
}

export async function confirmSubmission(submissionId: string): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  try {
    const result = await db.$transaction(async tx => {
      const item = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" }, select: { batchId: true, expectedPages: true, pages: { select: { pageNumber: true } } } });
      if (!item || (item.batchId && !validBatchPageCount(item.expectedPages ?? 0)) || !pagesComplete(item.expectedPages, item.pages.map(p => p.pageNumber))) return false;
      const updated = await tx.submission.updateMany({ where: { id: submissionId, teacherId: teacher.id, status: "DRAFT" }, data: { status: "IN_REVIEW" } });
      return updated.count === 1;
    }, { isolationLevel: "Serializable" });
    if (!result) return { error: "Upload every page in the correct order before confirming." };
  } catch { return { error: "Could not confirm the pages. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/submissions");
  return { error: "" };
}

export async function confirmAndAddBatchPaper(submissionId: string, nextPages: number): Promise<{ error: string; id?: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  try {
    const result = await db.$transaction(async tx => {
      const current = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "DRAFT", quiz: { teacherId: teacher.id }, batch: { teacherId: teacher.id } }, select: { quizId: true, batchId: true, expectedPages: true, pages: { select: { pageNumber: true } }, batch: { select: { _count: { select: { submissions: true } } } } } });
      if (!current?.batchId || !current.batch) return { error: "This paper is unavailable or already confirmed." };
      const error = nextBatchPaperError(current.expectedPages ?? 0, current.pages.map(page => page.pageNumber), current.batch._count.submissions, nextPages);
      if (error) return { error };
      const updated = await tx.submission.updateMany({ where: { id: submissionId, teacherId: teacher.id, status: "DRAFT" }, data: { status: "IN_REVIEW" } });
      if (updated.count !== 1) return { error: "This paper is unavailable or already confirmed." };
      const next = await tx.submission.create({ data: { teacherId: teacher.id, quizId: current.quizId, batchId: current.batchId, expectedPages: nextPages }, select: { id: true } });
      return { error: "", id: next.id };
    }, { isolationLevel: "Serializable" });
    if (!result.error) { revalidatePath(`/submissions/${submissionId}`); revalidatePath("/submissions"); }
    return result;
  } catch { return { error: "Could not start the next paper. Refresh and try again." }; }
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
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" }, select: { batchId: true, pages: { select: { pageNumber: true } } } });
      if (!submission) return "This submission is unavailable or already confirmed.";
      if (submission.batchId && !validBatchPageCount(count)) return "Batch papers can have at most 3 pages.";
      if (submission.pages.some(page => page.pageNumber > count)) return "Remove photos beyond the new page count first.";
      await tx.submission.update({ where: { id: submissionId }, data: { expectedPages: count } });
      return "";
    }, { isolationLevel: "Serializable" });
    if (result) return { error: result };
  } catch { return { error: "Could not update the page count. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}`);
  return { error: "" };
}

export async function swapPages(submissionId: string, firstId: string, secondId: string): Promise<{ error: string }> {
  const teacher = await getTeacher(); if (!teacher) return { error: "Please sign in again." };
  if (firstId === secondId) return { error: "Choose two different pages." };
  try {
    const ok = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "DRAFT", quiz: { teacherId: teacher.id } }, select: { id: true } });
      if (!submission) return false;
      const pages = await tx.submissionPage.findMany({ where: { submissionId, id: { in: [firstId, secondId] } }, select: { id: true, pageNumber: true } });
      if (pages.length !== 2) return false;
      await tx.submissionPage.update({ where: { id: pages[0].id }, data: { pageNumber: -1 } });
      await tx.submissionPage.update({ where: { id: pages[1].id }, data: { pageNumber: pages[0].pageNumber } });
      await tx.submissionPage.update({ where: { id: pages[0].id }, data: { pageNumber: pages[1].pageNumber } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!ok) return { error: "Pages changed or this paper is locked. Refresh and try again." };
  } catch { return { error: "Could not reorder pages. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}`); return { error: "" };
}
