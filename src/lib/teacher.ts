import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getTeacher() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, enabled: true, role: true } });
  return user?.enabled && user.role === "TEACHER" ? user : null;
}
