"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { groupImportedSections, parseImportedDraft } from "@/lib/quiz-import";
import { defaultEssayRubric } from "@/lib/rubric";

export async function saveImportedQuiz(title: string, input: unknown): Promise<{ error: string; id?: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  if (typeof title !== "string" || !title.trim() || title.length > 120) return { error: "Enter a quiz title." };
  const rows = parseImportedDraft(input);
  if (!rows) return { error: "Check the questions, choices, and answers before saving." };
  const groups = groupImportedSections(rows);
  try {
    const quiz = await db.quiz.create({ data: { teacherId: teacher.id, title: title.trim(), source: "BUILT", numbering: "CONTINUOUS", sections: { create: groups.map((section, position) => ({ title: section.title, instructions: section.directions, position, defaultPoints: 1, answerStyle: "circle", questions: { create: section.rows.map((row, questionPosition) => ({ position: questionPosition, text: row.text, type: row.type, points: 1, essayLineCount: row.type === "ESSAY" ? 7 : null, ...(row.type === "MULTIPLE_CHOICE" ? { choices: { create: row.choices.map((choice, choicePosition) => ({ ...choice, position: choicePosition })) } } : {}), ...(row.type === "ESSAY" ? { rubricCriteria: { create: defaultEssayRubric(1).map((criterion, criterionPosition) => ({ ...criterion, position: criterionPosition })) } } : row.answer ? { answerKey: { create: { acceptedAnswers: row.type === "IDENTIFICATION" ? row.answer.split("|").map(value => value.trim()) : [row.answer] } } } : {}) })) } })) } } });
    return { error: "", id: quiz.id };
  } catch { return { error: "Could not save the imported quiz. Please try again." }; }
}
