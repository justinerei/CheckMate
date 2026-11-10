"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createStudentCode } from "@/lib/student-code";
import { normalizeStudentCode, studentName } from "@/lib/student-input";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = { kind: "idle" | "success" | "error"; message: string };

async function currentTeacherId() {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  return user.id;
}

export async function createStudent(_previous: ActionState, form: FormData): Promise<ActionState> {
  const teacherId = await currentTeacherId();
  const name = studentName(form.get("name"));
  if (!name) return { kind: "error", message: "Enter a student name between 1 and 120 characters." };
  try {
    await db.student.create({ data: { name, code: createStudentCode(), teachers: { create: { teacherId } } } });
  } catch {
    return { kind: "error", message: "Could not add the student. Please try again." };
  }
  revalidatePath("/students");
  return { kind: "success", message: "Student added to your list." };
}

export async function linkStudent(_previous: ActionState, form: FormData): Promise<ActionState> {
  const teacherId = await currentTeacherId();
  const code = normalizeStudentCode(form.get("code"));
  if (!code) return { kind: "error", message: "Enter the full CheckMate student code, including the hyphens." };
  try {
    const student = await db.student.findUnique({ where: { code }, select: { id: true } });
    if (!student) return { kind: "error", message: "No student was found with that code. Check it and try again." };
    const existing = await db.teacherStudent.findUnique({ where: { teacherId_studentId: { teacherId, studentId: student.id } }, select: { teacherId: true } });
    if (existing) return { kind: "error", message: "This student is already on your list." };
    await db.teacherStudent.upsert({ where: { teacherId_studentId: { teacherId, studentId: student.id } }, create: { teacherId, studentId: student.id }, update: {} });
  } catch {
    return { kind: "error", message: "Could not link the student. Please try again." };
  }
  revalidatePath("/students");
  return { kind: "success", message: "Student linked to your list." };
}
