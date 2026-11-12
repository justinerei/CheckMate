"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { validateRubric, type CriterionDraft } from "@/lib/rubric";

export type KeyRow = { number: number; section: number; sectionTitle?: string; answer: string; type: string; style: string; points: number; directions: string; uncertain?: boolean; questionText?: string; rubric?: CriterionDraft[]; rubricConfirmed?: boolean };
export async function createExisting(title: string, rows: KeyRow[]): Promise<{ error: string; id?: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  if (typeof title !== "string" || !title.trim() || title.length > 120 || !Array.isArray(rows) || !rows.length || rows.length > 200) return { error: "Enter a title and 1–200 answers." };
  if (rows.some(row => !row || (row.sectionTitle !== undefined && (typeof row.sectionTitle !== "string" || row.sectionTitle.length > 120)) || (row.questionText !== undefined && (typeof row.questionText !== "string" || row.questionText.length > 4000)))) return { error: "Check the section names and essay questions." };
  if (rows.some(row => row?.uncertain)) return { error: "Check and confirm each uncertain answer before saving." };
  const invalidEssay = rows.find(row => row.type === "ESSAY" && (!row.rubricConfirmed || !validateRubric(row.rubric ?? [], row.points)));
  if (invalidEssay) return { error: `Question ${invalidEssay.number} needs a confirmed rubric whose criteria add up to its points.` };
  const styles = ["circle", "shade", "written", "box", "text"];
  const types = ["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION", "ESSAY"];
  const sorted = [...rows].sort((a, b) => a.number - b.number);
  if (sorted.some((r, i) => !r || r.number !== i + 1 || !Number.isInteger(r.section) || r.section < 1 || r.section > 200 || !types.includes(r.type) || !styles.includes(r.style) || typeof r.answer !== "string" || r.answer.length > 500 || (r.type !== "ESSAY" && !r.answer.split("|").some(a => a.trim())) || !Number.isFinite(r.points) || r.points <= 0 || r.points > 9999 || !/^\d+(\.\d{1,2})?$/.test(String(r.points)) || typeof r.directions !== "string" || r.directions.length > 1000)) return { error: "Check each answer, points, and question number. Numbers must be consecutive starting at 1." };
  if (sorted.some((r, i) => i > 0 && r.section < sorted[i - 1].section)) return { error: "Section numbers must follow the question order." };
  if (sorted.reduce((sum, row) => sum + row.points, 0) > 999999.99) return { error: "The total available points must not exceed 999999.99." };
  const groups = [...new Set(sorted.map(r => r.section))];
  if (groups.some(s => new Set(sorted.filter(r => r.section === s).map(r => r.style)).size !== 1)) return { error: "Questions in the same section must use the same answer style. Review the section settings or move a question to a different section." };
  const quiz = await db.quiz.create({ data: { teacherId: teacher.id, title: title.trim(), source: "EXISTING", numbering: "CONTINUOUS", sections: { create: groups.map((section, position) => { const questions = sorted.filter(r => r.section === section); return { position, title: questions[0].sectionTitle?.trim().slice(0, 120) || `Section ${section}`, answerStyle: questions[0].style, instructions: questions[0].directions.trim(), questions: { create: questions.map((r, qpos) => ({ position: qpos, type: r.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "IDENTIFICATION" | "ESSAY", text: r.type === "ESSAY" && r.questionText?.trim() ? r.questionText.trim().slice(0, 4000) : `Question ${r.number}`, points: r.points, ...(r.type !== "ESSAY" ? { answerKey: { create: { acceptedAnswers: r.answer.split("|").map(a => a.trim()).filter(Boolean) } } } : { rubricCriteria: { create: (r.rubric ?? []).map((criterion, position) => ({ title: criterion.title.trim(), description: criterion.description.trim(), maxPoints: criterion.maxPoints, position })) } }) })) } }; }) } } });
  return { error: "", id: quiz.id };
}
