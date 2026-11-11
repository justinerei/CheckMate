"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { revalidatePath } from "next/cache";
export async function confirmPaperName(id: string, _state: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher(); if (!teacher) return { message: "Please sign in again.", ok: false };
  const value = form.get("name"); const unnamed = form.get("unnamed") === "on";
  if (typeof value !== "string" || value.length > 120 || (!value.trim() && !unnamed) || (value.trim() && unnamed)) return { message: "Enter the name or select no readable name.", ok: false };
  const result = await db.submission.updateMany({ where: { id, teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id } }, data: { paperName: value.trim() || null, nameReviewed: true } });
  if (!result.count) return { message: "This paper is unavailable or already finalized.", ok: false };
  revalidatePath(`/submissions/${id}/review`); revalidatePath(`/submissions/${id}`); revalidatePath('/submissions');
  return { message: "Name confirmed.", ok: true };
}
