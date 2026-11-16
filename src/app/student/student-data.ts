import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releasedStudentResults } from "@/lib/student-portal";
import { redirect } from "next/navigation";

export async function studentUser() {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, name: true, email: true, role: true, enabled: true } }) : null;
  if (!user?.enabled || user.role !== "STUDENT") redirect("/");
  return user;
}

export async function studentResults(accountId: string) {
  const student = await db.student.findUnique({ where: { accountId }, select: { name: true, classes: { select: { classroom: { select: { id: true, name: true, teacher: { select: { name: true } } } } } }, submissions: { where: releasedStudentResults(accountId), orderBy: { releasedAt: "desc" }, select: { id: true, totalScore: true, releasedAt: true, quiz: { select: { title: true, sections: { select: { questions: { select: { points: true } } } } } } } } } });
  if (!student) return null;
  return { name: student.name, classes: student.classes.map(({ classroom }) => classroom), results: student.submissions.map(paper => ({ id: paper.id, title: paper.quiz.title, score: paper.totalScore?.toString() ?? "—", maximum: Math.round(paper.quiz.sections.flatMap(section => section.questions).reduce((sum, question) => sum + Number(question.points), 0) * 100) / 100, releasedAt: paper.releasedAt?.toISOString() ?? "" })) };
}
