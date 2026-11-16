import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import styles from "@/app/student/student.module.css";
import AccountControl from "./account-control";

export const instant = false;
export default async function AdminPage() {
  await connection();
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { role: true, enabled: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") redirect("/");
  const [users, quizzes, papers] = await Promise.all([db.user.findMany({ where: { role: { in: ["TEACHER", "STUDENT"] } }, select: { id: true, name: true, email: true, role: true, enabled: true }, orderBy: { createdAt: "desc" } }), db.quiz.count(), db.submission.count({ where: { status: "FINALIZED" } })]);
  return <main className={styles.page}><header className={styles.header}><span className={styles.brand}>checkmate<span>.</span></span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button>Sign out</button></form></header><h1>Admin.</h1><p>{users.length} teacher and student accounts · {quizzes} quizzes · {papers} finalized papers</p><h2>Accounts</h2>{users.length ? <ul className={styles.results}>{users.map(user => <li key={user.id}><span><strong>{user.name}</strong><small>{user.email} · {user.role.toLowerCase()} · {user.enabled ? "Active" : "Disabled"}</small></span><AccountControl id={user.id} enabled={user.enabled} /></li>)}</ul> : <p>No teacher or student accounts yet.</p>}</main>;
}
