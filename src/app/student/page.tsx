import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ClaimInvite } from "./invite-controls";
import styles from "./student.module.css";
import { releasedStudentResults } from "@/lib/student-portal";

export const instant = false;
export default async function StudentHome() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, name: true, role: true, enabled: true } }) : null;
  if (!user?.enabled) redirect("/student/sign-in");
  const student = user.role === "STUDENT" ? await db.student.findUnique({ where: { accountId: user.id }, select: { name: true, submissions: { where: releasedStudentResults(user.id), orderBy: { releasedAt: "desc" }, select: { id: true, totalScore: true, releasedAt: true, quiz: { select: { title: true, sections: { select: { questions: { select: { points: true } } } } } } } } } }) : null;
  return <main className={styles.page}><header className={styles.header}><span className={styles.brand}>checkmate<span>.</span></span><form action={async () => { "use server"; await signOut({ redirectTo: "/student/sign-in" }); }}><button>Sign out</button></form></header><h1>Hello, {user.name.split(" ")[0]}.</h1>{user.role !== "STUDENT" ? <p>This account is a {user.role.toLowerCase()} account. Sign out and use a separate student account to connect a student invite.</p> : !student ? <><p>Connect your account with the invite code your teacher gave you.</p><ClaimInvite /></> : <><p>Scores released by your teachers for {student.name}.</p>{student.submissions.length ? <ul className={styles.results}>{student.submissions.map(paper => <li key={paper.id}><span><strong>{paper.quiz.title}</strong><small>Released {paper.releasedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(paper.releasedAt) : ""}</small></span><strong>{paper.totalScore?.toString()} / {paper.quiz.sections.flatMap(section => section.questions).reduce((sum, question) => sum + Number(question.points), 0)}</strong></li>)}</ul> : <p>No released scores yet. Your teacher will let you know when results are ready.</p>}</>}</main>;
}
