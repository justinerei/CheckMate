import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import Mascot from "@/app/mascot";
import LibraryIcon from "@/app/library-icon";
import StudentShell from "../student-shell";
import { studentUser } from "../student-data";
import styles from "../student-workspace.module.css";

export const instant = false;
export default async function ClassesPage() {
  await connection();
  const user = await studentUser();
  const enrollments = await db.classEnrollment.findMany({ where: { student: { accountId: user.id } }, include: { classroom: { include: { teacher: { select: { name: true } }, submissions: { where: { student: { accountId: user.id }, status: "FINALIZED", releasedAt: { not: null }, totalScore: { not: null } }, select: { id: true } } } } }, orderBy: { joinedAt: "desc" } });
  return <StudentShell user={user} active="classes"><div className={`${styles.content} ${styles.home}`} data-student-home><header className={styles.welcome}><h1>My classes.</h1><p>See your classes and released papers in one place.</p></header><section className={styles.section}>{enrollments.length ? <ul className={styles.classList}>{enrollments.map(({ classroom }) => <li key={classroom.id}><Link className={styles.classLink} href={`/student/classes/${encodeURIComponent(classroom.id)}`}><div className={styles.classTop}><span className={styles.classIcon}><LibraryIcon type="quiz" /></span><span className={styles.classArrow} aria-hidden="true">↗</span></div><div className={styles.classDetails}><strong>{classroom.name}</strong><span>{classroom.teacher.name}</span></div><div className={styles.classFooter}><span>{classroom.submissions.length} released {classroom.submissions.length === 1 ? "paper" : "papers"}</span><strong>View class <span aria-hidden="true">→</span></strong></div></Link></li>)}</ul> : <div className={styles.classesEmpty}><Mascot state="empty" width={96} height={96} className={styles.classesEmptyMascot} /><div><h2>No classes yet.</h2><p>Ask your teacher for a class code or invite link.</p><Link className={styles.classesJoinButton} href="/student/join">Join a class <span aria-hidden="true">→</span></Link></div></div>}</section></div></StudentShell>;
}
