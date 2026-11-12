"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";

export type KeyRow = { number: number; section: number; answer: string; type: string; style: string; points: number; directions: string; uncertain?: boolean };
export async function createExisting(title: string, rows: KeyRow[]): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  if (typeof title !== "string" || !title.trim() || title.length > 120 || !Array.isArray(rows) || !rows.length || rows.length > 200) return { error: "Enter a title and 1–200 answers." };
  if (rows.some(row => row?.uncertain)) return { error: "Check and confirm each uncertain answer before saving." };
  const styles = ["circle", "shade", "written", "box", "text"];
  const types = ["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION", "ESSAY"];
  const sorted = [...rows].sort((a, b) => a.number - b.number);
  if (sorted.some((r, i) => !r || r.number !== i + 1 || !Number.isInteger(r.section) || r.section < 1 || r.section > 200 || !types.includes(r.type) || !styles.includes(r.style) || typeof r.answer !== "string" || r.answer.length > 500 || (r.type !== "ESSAY" && !r.answer.split("|").some(a => a.trim())) || !Number.isFinite(r.points) || r.points <= 0 || r.points > 9999 || !/^\d+(\.\d{1,2})?$/.test(String(r.points)) || typeof r.directions !== "string" || r.directions.length > 1000)) return { error: "Check each answer, points, and question number. Numbers must be consecutive starting at 1." };
  if (sorted.some((r, i) => i > 0 && r.section < sorted[i - 1].section)) return { error: "Section numbers must follow the question order." };
  if (sorted.reduce((sum, row) => sum + row.points, 0) > 999999.99) return { error: "The total available points must not exceed 999999.99." };
  const groups = [...new Set(sorted.map(r => r.section))];
  if (groups.some(s => new Set(sorted.filter(r => r.section === s).map(r => r.style)).size !== 1)) return { error: "Questions in the same section must use the same answer style. Review the section settings or move a question to a different section." };
  const quiz = await db.quiz.create({ data: { teacherId: teacher.id, title: title.trim(), source: "EXISTING", numbering: "CONTINUOUS", sections: { create: groups.map((section, position) => { const questions = sorted.filter(r => r.section === section); return { position, title: `Section ${section}`, answerStyle: questions[0].style, instructions: questions[0].directions.trim(), questions: { create: questions.map((r, qpos) => ({ position: qpos, type: r.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "IDENTIFICATION" | "ESSAY", text: `Question ${r.number}`, points: r.points, ...(r.type !== "ESSAY" ? { answerKey: { create: { acceptedAnswers: r.answer.split("|").map(a => a.trim()).filter(Boolean) } } } : {}) })) } }; }) } } });
  redirect(`/submissions/new?quizId=${encodeURIComponent(quiz.id)}`);
}
