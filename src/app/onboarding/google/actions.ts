"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validPendingGoogle } from "@/lib/pending-google";
import { redirect } from "next/navigation";

export async function completeGoogleAccount(_state: { error: string }, form: FormData) {
  const session = await auth();
  const pending = (session as (typeof session & { pendingGoogle?: unknown }))?.pendingGoogle;
  const role = form.get("role");
  if (!validPendingGoogle(pending) || session?.user?.id !== pending.googleId) return { error: "Your Google sign-in expired. Please sign in again." };
  if (role !== "TEACHER" && role !== "STUDENT") return { error: "Choose Teacher or Student." };
  try {
    const result = await db.$transaction(async tx => {
      const existing = await tx.user.findUnique({ where: { googleId: pending.googleId }, select: { id: true } });
      if (existing) return "existing";
      const collision = await tx.user.findFirst({ where: { email: { equals: pending.email, mode: "insensitive" } }, select: { id: true } });
      if (collision) return "collision";
      await tx.user.create({ data: { googleId: pending.googleId, email: pending.email, name: pending.name, role } });
      return "created";
    }, { isolationLevel: "Serializable" });
    if (result === "collision") return { error: "An account already uses this email. Sign in using its original method." };
  } catch { return { error: "Could not create your account. Please try again." }; }
  redirect("/");
}
