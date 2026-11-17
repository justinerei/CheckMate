"use server";

import { refresh } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password-auth";

export async function updateProfileName(form: FormData) {
  const session = await auth();
  const googleId = session?.user?.id;
  if (!googleId) return { ok: false, message: "Sign in to edit your profile." };

  const input = form.get("name");
  const name = typeof input === "string" ? input.trim() : "";
  if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
    return { ok: false, message: "Enter a name between 1 and 120 characters without control characters." };
  }

  try {
    const updated = await db.user.updateMany({
      where: { googleId, enabled: true, role: { in: ["TEACHER", "ADMIN"] } },
      data: { name },
    });
    if (updated.count !== 1) return { ok: false, message: "This account cannot edit its profile." };
  } catch {
    return { ok: false, message: "We couldn't save your profile. Try again." };
  }

  refresh();
  return { ok: true, message: "Profile updated." };
}

export async function changeAdminPassword(form: FormData) {
  const session = await auth();
  const googleId = session?.user?.id;
  if (!googleId) return { ok: false, message: "Sign in to change your password." };

  const current = form.get("currentPassword");
  const next = form.get("newPassword");
  if (typeof current !== "string" || !current || current.length > 128) {
    return { ok: false, message: "Enter your current password." };
  }
  if (typeof next !== "string" || next.length < 12 || next.length > 128) {
    return { ok: false, message: "Use 12 to 128 characters for your new password." };
  }
  if (next !== form.get("confirmPassword")) return { ok: false, message: "The new passwords don't match." };
  if (current === next) return { ok: false, message: "Choose a different password." };

  try {
    const admin = await db.user.findUnique({
      where: { googleId, enabled: true, role: "ADMIN" },
      select: { id: true, passwordHash: true, lockedUntil: true },
    });
    if (!admin?.passwordHash) return { ok: false, message: "This account doesn't have a CheckMate password." };
    const now = new Date();
    if (admin.lockedUntil && admin.lockedUntil > now) return { ok: false, message: "Too many attempts. Try again after the account lock expires." };

    const where = {
      id: admin.id, enabled: true, role: "ADMIN" as const, passwordHash: admin.passwordHash,
      OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
    };
    if (!await verifyPassword(current, admin.passwordHash)) {
      const locked = await db.$transaction(async tx => {
        const attempt = await tx.user.updateMany({ where, data: { failedLogins: { increment: 1 } } });
        if (!attempt.count) return false;
        const result = await tx.user.updateMany({
          where: { ...where, failedLogins: { gte: 5 } },
          data: { failedLogins: 0, lockedUntil: new Date(Date.now() + 15 * 60_000) },
        });
        return result.count === 1;
      });
      return { ok: false, message: locked ? "Too many attempts. Try again in 15 minutes." : "The current password is incorrect." };
    }

    const updated = await db.user.updateMany({
      where,
      data: { passwordHash: await hashPassword(next), failedLogins: 0, lockedUntil: null },
    });
    if (updated.count !== 1) return { ok: false, message: "Your account state changed. Try again." };
  } catch {
    return { ok: false, message: "We couldn't update your password. Try again." };
  }

  return { ok: true, message: "Password changed." };
}
