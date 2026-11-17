import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/teacher";
import { db } from "@/lib/db";
import { WorkspaceShell } from "@/app/workspace-frame";
import LoadingSkeleton from "@/app/loading-skeleton";
import { auth } from "@/auth";
import { teacherGoogleProfile } from "@/lib/teacher-google-profile";

async function WorkspaceSession({ children }: { children: React.ReactNode }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) { const session = await auth(); const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { enabled: true, role: true } }) : null; redirect(user?.enabled && user.role === "STUDENT" ? "/student" : user?.enabled && user.role === "ADMIN" ? "/admin" : "/"); }
  const [user, session] = await Promise.all([db.user.findUnique({ where: { id: teacher.id }, select: { email: true, name: true, googleId: true } }), auth()]);
  return <WorkspaceShell email={user?.email} name={user?.name} image={user ? teacherGoogleProfile(user.googleId, session?.user)?.image : null}>{children}</WorkspaceShell>;
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSkeleton variant="dashboard" />}><WorkspaceSession>{children}</WorkspaceSession></Suspense>;
}
