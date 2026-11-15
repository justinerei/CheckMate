import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/teacher";
import { db } from "@/lib/db";
import { WorkspaceShell } from "@/app/workspace-frame";
import LoadingSkeleton from "@/app/loading-skeleton";

async function WorkspaceSession({ children }: { children: React.ReactNode }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const user = await db.user.findUnique({ where: { id: teacher.id }, select: { email: true } });
  return <WorkspaceShell email={user?.email}>{children}</WorkspaceShell>;
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSkeleton variant="dashboard" />}><WorkspaceSession>{children}</WorkspaceSession></Suspense>;
}
