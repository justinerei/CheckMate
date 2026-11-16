"use server";

import { randomBytes } from "node:crypto";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { createStudentCode } from "@/lib/student-code";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type State = { message: string; ok: boolean };

export async function findClass(code: string): Promise<{ name?: string; teacher?: string; error?: string }> {
  const user = await currentUser();
  if (!user?.enabled || user.role !== "STUDENT") return { error: "Sign in with a student account first." };
  if (!/^[a-f0-9]{32}$/.test(code.trim().toLowerCase())) return { error: "Enter the class code from your teacher." };
  const classroom = await db.classroom.findUnique({ where: { joinCode: code.trim().toLowerCase() }, select: { name: true, teacher: { select: { name: true, enabled: true } } } });
  return classroom?.teacher.enabled ? { name: classroom.name, teacher: classroom.teacher.name } : { error: "Class not found. Ask your teacher for a new link." };
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

export async function cancelClassInvite() {
  (await cookies()).delete("class-invite");
  redirect("/student");
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
  try {
    const result = await db.$transaction(async tx => {
      const classroom = await tx.classroom.findUnique({ where: { joinCode: code }, select: { id: true, teacherId: true, name: true, teacher: { select: { enabled: true } } } });
      if (!classroom?.teacher.enabled) return null;
      const student = await tx.student.upsert({ where: { accountId: user.id }, update: {}, create: { name: user.name, accountId: user.id, code: createStudentCode() }, select: { id: true } });
      await tx.teacherStudent.upsert({ where: { teacherId_studentId: { teacherId: classroom.teacherId, studentId: student.id } }, create: { teacherId: classroom.teacherId, studentId: student.id }, update: {} });
      await tx.classEnrollment.upsert({ where: { classroomId_studentId: { classroomId: classroom.id, studentId: student.id } }, create: { classroomId: classroom.id, studentId: student.id }, update: {} });
      return classroom.name;
    });
    if (!result) return { ok: false, message: "Class not found. Ask your teacher for a new link." };
    (await cookies()).delete("class-invite");
    revalidatePath("/student"); revalidatePath("/students");
    return { ok: true, message: `You joined ${result}. Your teacher can now link your papers to you.` };
  } catch { return { ok: false, message: "Could not join the class. Please try again." }; }
}
