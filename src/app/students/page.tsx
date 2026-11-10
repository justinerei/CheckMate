import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { CreateStudentForm, LinkStudentForm } from "./student-forms";
import CopyCode from "./copy-code";
import styles from "./students.module.css";

export const instant = false;

export default async function StudentsPage() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true, email: true } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  const links = await db.teacherStudent.findMany({ where: { teacherId: user.id }, orderBy: { student: { name: "asc" } }, select: { student: { select: { id: true, name: true, code: true } } } });
  return <main className={styles.shell}>
    <header className={styles.header}><Link className={styles.logo} href="/dashboard">checkmate<span>.</span></Link><div className={styles.headerRight}><span className={styles.email}>{user.email}</span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className={styles.signout}>Sign out ↗</button></form></div></header>
    <div className={styles.body}><aside className={styles.sidebar}><p className={styles.navLabel}>WORKSPACE</p><nav aria-label="Workspace"><Link className={styles.navLink} href="/dashboard">▦ <span>Overview</span></Link><span className={styles.active} aria-current="page">♙ <span>Students</span></span></nav><p className={styles.sidebarNote}>Your space to create, review, and keep track.</p></aside>
      <div className={styles.content}><Link className={styles.back} href="/dashboard">← Back to overview</Link><p className={styles.eyebrow}>YOUR WORKSPACE <span>✳</span></p><h1>Students.</h1><p className={styles.description}>Keep your student list ready for checking quiz papers.</p>
        <div className={styles.toolGrid}><details className={styles.tool}><summary>＋ Add a student<span>Create a new student record</span></summary><CreateStudentForm /></details><details className={styles.tool}><summary>↗ Link an existing student<span>Use their CheckMate student code</span></summary><LinkStudentForm /></details></div>
        <section className={styles.listSection} aria-labelledby="student-list"><div className={styles.listHeader}><div><p className={styles.eyebrow}>01 / YOUR STUDENTS</p><h2 id="student-list">Student list</h2></div><span className={styles.counter}>{links.length} {links.length === 1 ? "STUDENT" : "STUDENTS"}</span></div>
          {links.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}>＋</div><h3>No students yet.</h3><p>Add a new student or link an existing one to get started.</p></div> : <ul className={styles.list}>{links.map(({ student }, index) => <li key={student.id} className={styles.row}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><div className={styles.student}><h3>{student.name}</h3><details className={styles.code}><summary>Show sharing code</summary><p>Share this code only with a teacher who needs to link this student.</p><CopyCode code={student.code} /></details></div></li>)}</ul>}
        </section><p className={styles.footer}>CHECKMATE / YOUR CLASSROOM COMPANION</p>
      </div></div>
  </main>;
}
