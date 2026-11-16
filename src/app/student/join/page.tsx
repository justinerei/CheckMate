import { auth } from "@/auth";
import { db } from "@/lib/db";
import { JoinClass } from "@/app/classes/class-controls";
import { cancelClassInvite, continueToSignIn, switchToStudentAccount } from "@/app/classes/actions";
import Link from "next/link";
import Mascot from "@/app/mascot";
import StudentShell from "../student-shell";
import styles from "../student-workspace.module.css";
import invite from "./join.module.css";

export default async function JoinClassPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = "" } = await searchParams;
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { email: true, role: true, enabled: true } }) : null;
  const classroom = /^[a-f0-9]{32}$/i.test(code) ? await db.classroom.findUnique({ where: { joinCode: code.toLowerCase() }, select: { name: true, teacher: { select: { name: true, enabled: true } } } }) : null;
  if (!user?.enabled || user.role !== "STUDENT") return <main className={invite.shell}><header className={invite.header}><Link href="/" className={invite.logo}>checkmate<span>.</span></Link><span className={invite.headerNote}>YOUR CLASSROOM COMPANION</span></header><div className={invite.layout}><section className={invite.intro}><p className={invite.eyebrow}>A LITTLE LESS CHECKING <span>✳</span></p><h1>Your class,<br /><span>all in one place.</span></h1><p>Join your teacher on CheckMate to see your released quiz results and feedback.</p></section><section className={invite.card}><div className={invite.cardTop}><span>CLASS INVITATION</span><span>●</span></div><Mascot state="ready" width={96} height={96} className={invite.mascot} /><h2>Join your class.</h2>{classroom?.teacher.enabled ? <div className={invite.classInfo}><span>YOU ARE INVITED TO</span><strong>{classroom.name}</strong><small>Teacher: {classroom.teacher.name}</small></div> : <p className={invite.warning}>This invitation is invalid or unavailable. Ask your teacher for a new link.</p>}{classroom?.teacher.enabled && (user?.enabled ? <><p>You are signed in as {user.email}. Use a student account to join this class.</p><form action={switchToStudentAccount}><input type="hidden" name="code" value={code} /><button className={invite.primary}>Switch to student account <span aria-hidden="true">↗</span></button></form></> : <><p>Sign in or create a student account to continue. Your invitation will be waiting for you.</p><form action={continueToSignIn} className={invite.actions}><input type="hidden" name="code" value={code} /><button className={invite.primary}>Sign in <span aria-hidden="true">↗</span></button><button className={invite.secondary} name="register" value="1">Create student account <span aria-hidden="true">↗</span></button></form></>)}</section></div><footer className={invite.footer}>CHECKMATE / YOUR CLASSROOM COMPANION</footer></main>;
  return <StudentShell email={user.email} active="overview"><div className={styles.content}><header className={styles.welcome}><h1>Join a class.</h1><p>{classroom?.teacher.enabled ? `${classroom.name} · ${classroom.teacher.name}` : "Enter the class code from your teacher."}</p></header><section className={styles.connect}><div><p>If your teacher has already recorded scores for you, connect your existing student record using their one-time invite first.</p><JoinClass code={code} /><form action={cancelClassInvite}><button>Back to overview</button></form></div></section></div></StudentShell>;
}
