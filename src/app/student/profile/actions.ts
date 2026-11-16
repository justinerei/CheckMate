"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { studentName } from "@/lib/student-input";
import { revalidatePath } from "next/cache";

export async function updateSchoolName(_state: { message: string; ok: boolean }, form: FormData) {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!user?.enabled || user.role !== "STUDENT") return { ok: false, message: "Sign in with your student account." };
  const name = studentName(form.get("schoolName"));
  if (!name) return { ok: false, message: "Enter a name between 1 and 120 characters without control characters." };
  try {
    const updated = await db.student.updateMany({ where: { accountId: user.id }, data: { name } });
    if (updated.count !== 1) return { ok: false, message: "Join a class or connect your existing student record first." };
  } catch { return { ok: false, message: "Could not save your school name. Please try again." }; }
  revalidatePath("/student"); revalidatePath("/student/profile"); revalidatePath("/student/classes"); revalidatePath("/students"); revalidatePath("/submissions/[id]/review", "page");
  return { ok: true, message: "School name saved. Your teachers will see this name." };
}
