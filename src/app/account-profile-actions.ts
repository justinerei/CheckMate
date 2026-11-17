"use server";

import { refresh } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
