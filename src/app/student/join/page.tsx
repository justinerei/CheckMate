import { auth } from "@/auth";
import { db } from "@/lib/db";
import { JoinClass } from "@/app/classes/class-controls";
import { cancelClassInvite, continueToSignIn } from "@/app/classes/actions";
import StudentShell from "../student-shell";
import styles from "../student-workspace.module.css";

export default async function JoinClassPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = "" } = await searchParams;
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { email: true, role: true, enabled: true } }) : null;
  if (!user?.enabled || user.role !== "STUDENT") return <main style={{ padding: "3rem" }}><h1>Join a class</h1><p>Sign in or create a student account to join this class. If another account is signed in, sign out first.</p><form action={continueToSignIn}><input type="hidden" name="code" value={code} /><button>Sign in</button><button name="register" value="1">Create student account</button></form></main>;
  const classroom = /^[a-f0-9]{32}$/i.test(code) ? await db.classroom.findUnique({ where: { joinCode: code.toLowerCase() }, select: { name: true, teacher: { select: { name: true, enabled: true } } } }) : null;
  return <StudentShell email={user.email} active="overview"><div className={styles.content}><header className={styles.welcome}><h1>Join a class.</h1><p>{classroom?.teacher.enabled ? `${classroom.name} · ${classroom.teacher.name}` : "Enter the class code from your teacher."}</p></header><section className={styles.connect}><div><p>If your teacher has already recorded scores for you, connect your existing student record using their one-time invite first.</p><JoinClass code={code} /><form action={cancelClassInvite}><button>Back to overview</button></form></div></section></div></StudentShell>;
}
