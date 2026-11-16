"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { changeAccountAccess } from "@/lib/admin-activity";

export async function setAccountEnabled(id: string, enabled: boolean): Promise<{ error: string }> {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") return { error: "Administrator access required." };
  if (typeof id !== "string" || !id || id.length > 200 || typeof enabled !== "boolean") return { error: "Account unavailable." };
  try {
    const updated = await db.$transaction(tx => changeAccountAccess(tx, admin.id, id, enabled), { isolationLevel: "Serializable" });
    if (!updated) return { error: "Account unavailable or already updated. Refresh and try again." };
  } catch { return { error: "Could not update account. Try again." }; }
  revalidatePath("/admin");
  return { error: "" };
}

export async function unlockAccount(id: string): Promise<{ error: string }> {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") return { error: "Administrator access required." };
  if (typeof id !== "string" || !id || id.length > 200) return { error: "Account unavailable." };
  try {
    const updated = await db.$transaction(async tx => {
      const result = await tx.user.updateMany({ where: { id, role: { in: ["TEACHER", "STUDENT"] }, lockedUntil: { gt: new Date() } }, data: { lockedUntil: null, failedLogins: 0 } });
      if (result.count !== 1) return false;
      await tx.adminActivity.create({ data: { actorId: admin.id, targetId: id, action: "ACCOUNT_UNLOCKED" } });
      return true;
    });
    if (!updated) return { error: "Account is no longer locked. Refresh and try again." };
  } catch { return { error: "Could not unlock account. Try again." }; }
  revalidatePath("/admin");
  return { error: "" };
}
