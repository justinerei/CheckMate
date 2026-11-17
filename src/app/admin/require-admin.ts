import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getAdmin() {
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({
    where: { googleId: session.user.id },
    select: { id: true, role: true, enabled: true, email: true, name: true },
  }) : null;
  return admin?.enabled && admin.role === "ADMIN" ? admin : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/");
  return admin;
}
