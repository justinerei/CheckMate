"use server";

import { randomBytes } from "node:crypto";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { createStudentCode } from "@/lib/student-code";
import { studentName } from "@/lib/student-input";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { studentJoinBack } from "@/lib/student-navigation";

type State = { message: string; ok: boolean };

export async function findClass(code: string): Promise<{ name?: string; teacher?: string; schoolName?: string | null; accountName?: string; error?: string }> {
  const user = await currentUser();
  if (!user?.enabled || user.role !== "STUDENT") return { error: "Sign in with a student account first." };
  if (!/^[a-f0-9]{32}$/.test(code.trim().toLowerCase())) return { error: "Enter the class code from your teacher." };
  const classroom = await db.classroom.findUnique({ where: { joinCode: code.trim().toLowerCase() }, select: { name: true, teacher: { select: { name: true, enabled: true } } } });
  if (!classroom?.teacher.enabled) return { error: "Class not found. Ask your teacher for a new link." };
  const student = await db.student.findUnique({ where: { accountId: user.id }, select: { name: true } });
  return { name: classroom.name, teacher: classroom.teacher.name, schoolName: student?.name ?? null, accountName: user.name };
}

export async function continueToSignIn(form: FormData) {
  const code = String(form.get("code") ?? "").toLowerCase();
  if (/^[a-f0-9]{32}$/.test(code)) (await cookies()).set("class-invite", code, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600 });
  redirect(form.get("register") === "1" ? "/register?role=student" : "/");
}

export async function switchToStudentAccount(form: FormData) {
  const code = String(form.get("code") ?? "").toLowerCase();
  if (/^[a-f0-9]{32}$/.test(code)) (await cookies()).set("class-invite", code, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600 });
  await signOut({ redirectTo: "/" });
}

export async function cancelClassInvite(form: FormData) {
  (await cookies()).delete("class-invite");
  redirect(studentJoinBack(form.get("from")));
}

async function currentUser() {
  const session = await auth();
  return session?.user?.id ? db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, name: true, role: true, enabled: true } }) : null;
}

export async function createClass(_state: State, form: FormData): Promise<State> {
  const user = await currentUser();
  if (!user?.enabled || user.role !== "TEACHER") return { ok: false, message: "Sign in as a teacher." };
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 120) return { ok: false, message: "Enter a class name of up to 120 characters." };
  try {
    await db.classroom.create({ data: { name, teacherId: user.id, joinCode: randomBytes(16).toString("hex") } });
  } catch { return { ok: false, message: "Could not create the class. Please try again." }; }
  revalidatePath("/students");
  return { ok: true, message: "Class created. Share its link with your students." };
}

export async function joinClass(_state: State, form: FormData): Promise<State> {
  const user = await currentUser();
  if (!user?.enabled || user.role !== "STUDENT") return { ok: false, message: "Sign in with a student account first." };
  const code = String(form.get("code") ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(code)) return { ok: false, message: "Enter the class code from your teacher." };
  const schoolName = studentName(form.get("schoolName"));
  try {
    const result = await db.$transaction(async tx => {
      const classroom = await tx.classroom.findUnique({ where: { joinCode: code }, select: { id: true, teacherId: true, name: true, teacher: { select: { enabled: true } } } });
      if (!classroom?.teacher.enabled) return null;
      const existing = await tx.student.findUnique({ where: { accountId: user.id }, select: { id: true } });
      if (!existing && !schoolName) return { nameRequired: true };
      const student = existing ?? await tx.student.upsert({ where: { accountId: user.id }, update: {}, create: { name: schoolName!, accountId: user.id, code: createStudentCode() }, select: { id: true } });
      await tx.teacherStudent.upsert({ where: { teacherId_studentId: { teacherId: classroom.teacherId, studentId: student.id } }, create: { teacherId: classroom.teacherId, studentId: student.id }, update: {} });
      await tx.classEnrollment.upsert({ where: { classroomId_studentId: { classroomId: classroom.id, studentId: student.id } }, create: { classroomId: classroom.id, studentId: student.id }, update: {} });
      return { className: classroom.name };
    });
    if (!result) return { ok: false, message: "Class not found. Ask your teacher for a new link." };
    if ("nameRequired" in result) return { ok: false, message: "Enter the name you use on your school papers." };
    (await cookies()).delete("class-invite");
    revalidatePath("/student"); revalidatePath("/students");
    return { ok: true, message: `You joined ${result.className}. Your teacher can now link your papers to you.` };
  } catch { return { ok: false, message: "Could not join the class. Please try again." }; }
}
