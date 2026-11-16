"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function setAccountEnabled(id: string, enabled: boolean): Promise<{ error: string }> {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") return { error: "Administrator access required." };
  if (typeof id !== "string" || !id || id.length > 200 || typeof enabled !== "boolean") return { error: "Account unavailable." };
  try {
    const result = await db.user.updateMany({ where: { id, role: { in: ["TEACHER", "STUDENT"] } }, data: { enabled } });
    if (result.count !== 1) return { error: "Account unavailable." };
  } catch { return { error: "Could not update account. Try again." }; }
  revalidatePath("/admin");
  return { error: "" };
}
