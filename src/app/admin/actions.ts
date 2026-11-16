"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { changeAccountAccess } from "@/lib/admin-activity";

export async function setAccountEnabled(id: string, enabled: boolean, reason = ""): Promise<{ error: string }> {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") return { error: "Administrator access required." };
  if (typeof id !== "string" || !id || id.length > 200 || typeof enabled !== "boolean" || typeof reason !== "string" || reason.length > 500) return { error: "Account unavailable." };
  try {
    const updated = await db.$transaction(tx => changeAccountAccess(tx, admin.id, id, enabled, reason.trim()), { isolationLevel: "Serializable" });
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

export async function retryPages(ids: string[]): Promise<{ error: string; count: number }> {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") return { error: "Administrator access required.", count: 0 };
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100 || ids.some(id => typeof id !== "string" || !id || id.length > 200)) return { error: "Select up to 100 pages.", count: 0 };
  try {
    const count = await db.$transaction(async tx => {
      const pages = await tx.submissionPage.findMany({ where: { id: { in: ids }, status: "FAILED", retryAt: null, submission: { batchId: { not: null }, status: "IN_REVIEW" } }, select: { id: true, pageNumber: true, submission: { select: { teacherId: true, quiz: { select: { title: true } } } } } });
      let updated = 0;
      for (const page of pages) {
        const result = await tx.submissionPage.updateMany({ where: { id: page.id, status: "FAILED", retryAt: null, submission: { batchId: { not: null }, status: "IN_REVIEW" } }, data: { status: "PENDING", error: null } });
        if (result.count) {
          await tx.adminActivity.create({ data: { actorId: admin.id, targetId: page.submission.teacherId, action: "PAGE_RETRY", reason: `Page ${page.pageNumber} of ${page.submission.quiz.title}` } });
          updated++;
        }
      }
      return updated;
    });
    revalidatePath("/admin");
    return { error: count ? "" : "No selected pages are ready to retry.", count };
  } catch { return { error: "Could not queue pages. Try again.", count: 0 }; }
}
