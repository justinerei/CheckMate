import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import AccountProfile from "@/app/account-profile";

export const instant = false;

export default async function TeacherProfile() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const user = await db.user.findUnique({ where: { id: teacher.id }, select: { name: true, email: true } });
  if (!user) redirect("/");
  return <AccountProfile user={user} role="Teacher" />;
}
