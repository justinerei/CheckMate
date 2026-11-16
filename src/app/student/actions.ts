"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { revalidatePath } from "next/cache";
import { newStudentInviteCode, studentInviteHash, validStudentInviteCode } from "@/lib/student-portal";

export async function createStudentInvite(studentId: string): Promise<{ code?: string; error?: string }> {
  const teacher = await getTeacher();
  if (!teacher || typeof studentId !== "string" || studentId.length > 200) return { error: "Student unavailable." };
  const code = newStudentInviteCode();
  try {
    const created = await db.$transaction(async tx => {
      const student = await tx.student.findFirst({ where: { id: studentId, accountId: null, teachers: { some: { teacherId: teacher.id } } }, select: { id: true } });
      if (!student) return false;
      await tx.studentInvite.updateMany({ where: { studentId, usedAt: null }, data: { usedAt: new Date() } });
      await tx.studentInvite.create({ data: { studentId, tokenHash: studentInviteHash(code), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      return true;
    }, { isolationLevel: "Serializable" });
    return created ? { code } : { error: "Student unavailable or already linked to an account." };
  } catch { return { error: "Could not create the invite. Please try again." }; }
}

export async function claimStudentInvite(_state: { message: string; ok: boolean }, form: FormData) {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, enabled: true, role: true } }) : null;
  const code = form.get("code");
  if (!user?.enabled || user.role !== "STUDENT") return { message: "Sign in with a student account.", ok: false };
  if (!validStudentInviteCode(code)) return { message: "Enter the invite code from your teacher.", ok: false };
  try {
    const linked = await db.$transaction(async tx => {
      if (await tx.student.findUnique({ where: { accountId: user.id } })) return false;
      const invite = await tx.studentInvite.findUnique({ where: { tokenHash: studentInviteHash(code) }, select: { id: true, studentId: true, usedAt: true, expiresAt: true } });
      if (!invite || invite.usedAt || invite.expiresAt <= new Date()) return false;
      const used = await tx.studentInvite.updateMany({ where: { id: invite.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (used.count !== 1) return false;
      const student = await tx.student.updateMany({ where: { id: invite.studentId, accountId: null }, data: { accountId: user.id } });
      if (student.count !== 1) throw new Error("Student already linked");
      await tx.studentInvite.updateMany({ where: { studentId: invite.studentId, usedAt: null }, data: { usedAt: new Date() } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!linked) return { message: "This invite is invalid, expired, or already used, or your account is already linked.", ok: false };
  } catch { return { message: "Could not link this account. Ask your teacher for a new invite.", ok: false }; }
  revalidatePath("/student"); revalidatePath("/students");
  return { message: "Your account is linked!", ok: true };
}

export async function setResultReleased(id: string, release: boolean): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher || typeof id !== "string" || !id || id.length > 200 || typeof release !== "boolean") return { error: "Paper unavailable." };
  try {
    const result = await db.submission.updateMany({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "FINALIZED", studentId: { not: null }, totalScore: { not: null } }, data: { releasedAt: release ? new Date() : null } });
    if (result.count !== 1) return { error: "Finalize the paper and link it to a student first." };
  } catch { return { error: "Could not update result visibility. Try again." }; }
  revalidatePath("/students"); revalidatePath(`/submissions/${id}/review`); revalidatePath("/student");
  return { error: "" };
}
