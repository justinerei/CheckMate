import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({
    where: { googleId: session.user.id },
    select: { role: true, enabled: true, email: true, name: true },
  }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") redirect("/");
  return admin;
}
