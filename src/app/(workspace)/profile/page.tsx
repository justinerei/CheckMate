import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import AccountProfile from "@/app/account-profile";
import { auth } from "@/auth";
import { teacherGoogleProfile } from "@/lib/teacher-google-profile";

export const instant = false;

export default async function TeacherProfile() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const [user, session] = await Promise.all([db.user.findUnique({ where: { id: teacher.id }, select: { name: true, email: true, googleId: true } }), auth()]);
  if (!user) redirect("/");
  return <AccountProfile user={user} role="Teacher" googleProfile={teacherGoogleProfile(user.googleId, session?.user)} signInMethod={user.googleId.startsWith("local:") ? "Email and password" : "Google"} />;
}
