import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { resultsCsv } from "@/lib/results-csv";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return new Response("Please sign in again.", { status: 401 });
  const { id } = await params;
  const quiz = await db.quiz.findFirst({
    where: { id, teacherId: teacher.id },
    select: {
      sections: { select: { questions: { select: { points: true } } } },
      submissions: { where: { teacherId: teacher.id, status: "FINALIZED" }, orderBy: { finalizedAt: "asc" }, select: { paperName: true, student: { select: { name: true } }, totalScore: true, finalizedAt: true } },
    },
  });
  if (!quiz) return new Response("Quiz not found.", { status: 404 });
  const maximum = quiz.sections.flatMap(section => section.questions).reduce((sum, question) => sum + Number(question.points), 0);
  const csv = resultsCsv(quiz.submissions.map(paper => ({ name: paper.paperName || paper.student?.name || "Unnamed paper", score: paper.totalScore?.toString() ?? "", maximum: String(Math.round(maximum * 100) / 100), finalizedAt: paper.finalizedAt })));
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="checkmate-results.csv"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
