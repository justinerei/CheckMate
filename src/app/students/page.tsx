import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { CreateStudentForm, LinkStudentForm } from "./student-forms";
import CopyCode from "./copy-code";
import RemoveStudent from "./remove-student";
import WorkspaceFrame from "../workspace-frame";
import styles from "./students.module.css";

export const instant = false;

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true, email: true } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  const { student: expandedStudent } = await searchParams;
  const links = await db.teacherStudent.findMany({ where: { teacherId: user.id }, orderBy: { student: { name: "asc" } }, select: { student: { select: { id: true, name: true, code: true, submissions: { where: { teacherId: user.id, status: "FINALIZED", quiz: { teacherId: user.id } }, orderBy: { finalizedAt: "desc" }, select: { id: true, totalScore: true, finalizedAt: true, quiz: { select: { title: true, sections: { select: { questions: { select: { points: true } } } } } } } } } } } });
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  return <WorkspaceFrame active="students" teacherId={user.id}><div className={styles.content}><p className={styles.eyebrow}>YOUR WORKSPACE <span>✳</span></p><h1>Students.</h1><p className={styles.description}>Keep your student list ready for checking quiz papers.</p>
        <div className={styles.toolGrid}><details className={styles.tool}><summary>＋ Add a student<span>Create a new student record</span></summary><CreateStudentForm /></details><details className={styles.tool}><summary>↗ Link an existing student<span>Use their CheckMate student code</span></summary><LinkStudentForm /></details></div>
        <section className={styles.listSection} aria-labelledby="student-list"><div className={styles.listHeader}><div><p className={styles.eyebrow}>01 / YOUR STUDENTS</p><h2 id="student-list">Student list</h2></div><span className={styles.counter}>{links.length} {links.length === 1 ? "STUDENT" : "STUDENTS"}</span></div>
          {links.length === 0 ? <div className={styles.empty}><Image src="/images/mate/ready.png" width={112} height={112} alt="" aria-hidden="true" className={styles.emptyMate} /><h3>No students yet.</h3><p>Add a new student or link an existing one to get started.</p></div> : <ul className={styles.list}>{links.map(({ student }, index) => <li key={student.id} id={`student-${student.id}`} className={styles.row}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><div className={styles.student}><div className={styles.studentHeading}><h3>{student.name}</h3><RemoveStudent id={student.id} name={student.name} /></div><details className={styles.code}><summary>Show sharing code</summary><p>Share this code only with a teacher who needs to link this student.</p><CopyCode code={student.code} /></details><details className={styles.history} open={expandedStudent === student.id || undefined}><summary>Quiz history <span>· {student.submissions.length} finalized</span></summary>{student.submissions.length ? <ul>{student.submissions.map(paper => { const maximum = paper.quiz.sections.flatMap(section => section.questions).reduce((sum, question) => sum + Number(question.points), 0); return <li key={paper.id}><Link href={`/submissions/${encodeURIComponent(paper.id)}/review?from=students`}><span><strong>{paper.quiz.title}</strong><small>{paper.finalizedAt ? `Finalized ${date.format(paper.finalizedAt)}` : "Finalized"}</small></span><span className={styles.historyScore}>{paper.totalScore !== null ? `${paper.totalScore.toString()} / ${Math.round(maximum * 100) / 100}` : "Score unavailable"} <span aria-hidden="true">→</span></span></Link></li>; })}</ul> : <p>No linked finalized papers yet. Link a paper to this student in its review.</p>}</details></div></li>)}</ul>}
        </section><p className={styles.footer}>CHECKMATE / YOUR CLASSROOM COMPANION</p>
      </div></WorkspaceFrame>;
}
