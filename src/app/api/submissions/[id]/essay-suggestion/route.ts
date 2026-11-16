import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { geminiText } from "@/lib/gemini";
import { suggestEssayScores } from "@/lib/essay-suggestion";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher(); if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try { if (!request.headers.get("origin") || new URL(request.headers.get("origin")!).host !== request.headers.get("host")) throw new Error(); } catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  try {
    const { id } = await params; const input = await request.json();
    if (typeof input.questionId !== "string" || typeof input.answer !== "string" || !input.answer.trim() || input.answer.length > 4000) return NextResponse.json({ error: "Enter the student answer before requesting a suggestion." }, { status: 400 });
    const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id } }, select: { quizId: true } });
    const question = submission && await db.question.findFirst({ where: { id: input.questionId, type: "ESSAY", section: { quizId: submission.quizId } }, include: { rubricCriteria: { orderBy: { position: "asc" } } } });
    if (!question?.rubricCriteria.length) return NextResponse.json({ error: "Essay rubric unavailable." }, { status: 404 });
    const criteria = question.rubricCriteria.map(c => ({ id: c.id, title: c.title, description: c.description, maxPoints: Number(c.maxPoints) }));
    const result = await suggestEssayScores(question.text, input.answer, criteria, geminiText);
    if (result.kind === "limited") return NextResponse.json({ error: "AI services reached a rate limit. Try again later or score manually.", ...(result.retryAfterSeconds ? { retryAfterSeconds: result.retryAfterSeconds } : {}) }, { status: 429 });
    if (result.kind !== "ok") return NextResponse.json({ error: result.kind === "missing" ? "Add GEMINI_API_KEY and restart the app." : result.kind === "config" ? "Check GEMINI_TEXT_MODEL and restart the app." : result.kind === "upstream" ? `AI services could not suggest scores (HTTP ${result.status}).` : "Could not generate valid Gemini suggestions. Try again or score manually." }, { status: result.kind === "missing" || result.kind === "config" ? 503 : 502 });
    return NextResponse.json({ assessments: result.assessments });
  } catch { return NextResponse.json({ error: "Could not generate valid suggestions. Try again or score the rubric manually." }, { status: 400 }); }
}
