import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import Mascot from "@/app/mascot";
import StudentShell from "../student-shell";
import { studentUser } from "../student-data";
import styles from "../student-workspace.module.css";

export const instant = false;
export default async function ClassesPage() {
  await connection();
  const user = await studentUser();
  const enrollments = await db.classEnrollment.findMany({ where: { student: { accountId: user.id } }, include: { classroom: { include: { teacher: { select: { name: true } }, submissions: { where: { student: { accountId: user.id }, status: "FINALIZED", releasedAt: { not: null }, totalScore: { not: null } }, select: { id: true } } } } }, orderBy: { joinedAt: "desc" } });
  return <StudentShell email={user.email} active="classes"><div className={styles.content}><header className={styles.welcome}><h1>My classes.</h1><p>See your classes and released papers in one place.</p></header><section className={styles.section}>{enrollments.length ? <ul className={styles.classList}>{enrollments.map(({ classroom }) => <li key={classroom.id}><Link href={`/student/classes/${encodeURIComponent(classroom.id)}`}><strong>{classroom.name}</strong><span>{classroom.teacher.name} · {classroom.submissions.length} released {classroom.submissions.length === 1 ? "paper" : "papers"}</span><span aria-hidden="true">↗</span></Link></li>)}</ul> : <div className={styles.empty}><Mascot state="empty" width={96} height={96} /><div><strong>No classes yet.</strong><p>Ask your teacher for a class invite.</p><Link className={styles.link} href="/student">Join a class →</Link></div></div>}</section></div></StudentShell>;
}
