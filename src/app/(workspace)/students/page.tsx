import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Mascot from "@/app/mascot";
import { CreateStudentForm, LinkStudentForm } from "@/app/students/student-forms";
import CopyCode from "@/app/students/copy-code";
import RemoveStudent from "@/app/students/remove-student";
import styles from "@/app/students/students.module.css";
import { StudentInvite, ReleaseResult } from "@/app/student/invite-controls";
import { CreateClass, ShareClass } from "@/app/classes/class-controls";

export const instant = false;

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true, role: true, enabled: true, email: true } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  const { student: expandedStudent } = await searchParams;
  const classrooms = await db.classroom.findMany({ where: { teacherId: user.id }, orderBy: { createdAt: "desc" }, include: { enrollments: { include: { student: { select: { id: true, name: true } } }, orderBy: { joinedAt: "asc" } } } });
  const links = await db.teacherStudent.findMany({ where: { teacherId: user.id }, orderBy: { student: { name: "asc" } }, select: { student: { select: { id: true, name: true, code: true, accountId: true, submissions: { where: { teacherId: user.id, status: "FINALIZED", quiz: { teacherId: user.id } }, orderBy: { finalizedAt: "desc" }, select: { id: true, totalScore: true, finalizedAt: true, releasedAt: true, quiz: { select: { title: true, sections: { select: { questions: { select: { points: true } } } } } } } } } } } });
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  const records = new Map(links.map(({ student }) => [student.id, student]));
  const classStudentIds = new Set(classrooms.flatMap(classroom => classroom.enrollments.map(({ student }) => student.id)));
  const unassigned = links.map(({ student }) => student).filter(student => !classStudentIds.has(student.id));
  type StudentRecord = (typeof links)[number]["student"];
  function recordDetails(student: StudentRecord) {
    return <div className={styles.recordDetails}><div className={styles.studentHeading}><span className={styles.recordStatus}>{student.accountId ? "Student account connected" : "No student account connected"}</span><RemoveStudent id={student.id} name={student.name} /></div><details className={styles.code}><summary>Show sharing code</summary><p>Share this code only with a teacher who needs to link this student.</p><CopyCode code={student.code} /></details>{!student.accountId && <StudentInvite id={student.id} />}<details className={styles.history} open={expandedStudent === student.id || undefined}><summary>Quiz history <span>· {student.submissions.length} finalized</span></summary>{student.submissions.length ? <ul>{student.submissions.map(paper => { const maximum = paper.quiz.sections.flatMap(section => section.questions).reduce((sum, question) => sum + Number(question.points), 0); return <li key={paper.id}><Link href={`/submissions/${encodeURIComponent(paper.id)}/review?from=students`}><span><strong>{paper.quiz.title}</strong><small>{paper.finalizedAt ? `Finalized ${date.format(paper.finalizedAt)}` : "Finalized"}</small></span><span className={styles.historyScore}>{paper.totalScore !== null ? `${paper.totalScore.toString()} / ${Math.round(maximum * 100) / 100}` : "Score unavailable"} <span aria-hidden="true">→</span></span></Link><ReleaseResult id={paper.id} released={!!paper.releasedAt} /></li>; })}</ul> : <p>No linked finalized papers yet. Link a paper to this student in its review.</p>}</details></div>;
  }
  function studentRecord(student: StudentRecord, keyPrefix: string) {
    const firstClass = classrooms.find(classroom => classroom.enrollments.some(({ student: member }) => member.id === student.id));
    const anchorId = keyPrefix === "unassigned" || firstClass?.id === keyPrefix ? `student-${student.id}` : undefined;
    return <li key={`${keyPrefix}-${student.id}`} className={styles.classRecord}><details id={anchorId} open={expandedStudent === student.id || undefined}><summary><span>{student.name}</span><span>View record</span></summary>{recordDetails(student)}</details></li>;
  }
  return <div className={styles.content} data-classes-page><h1>Classes.</h1><p className={styles.description}>Manage your classes and the students in each one.</p>
    <div className={styles.classWorkspace}><section className={styles.classes}><div className={styles.classHeading}><div><p className={styles.eyebrow}>01 / YOUR CLASSROOMS</p><h2>Your classes</h2><p>Share an invite link to bring your students together.</p></div><span className={styles.counter}>{classrooms.length} {classrooms.length === 1 ? "CLASS" : "CLASSES"}</span></div>
      <details className={`${styles.tool} ${styles.createClass} ${!classrooms.length ? styles.createEmpty : ""}`}><summary>{!classrooms.length ? <><Mascot state="empty" width={96} height={96} className={styles.classEmptyMate} /><span className={styles.classEmptyCopy}><strong>No classes yet</strong><span>Create a class and invite your students with a link.</span><span className={styles.createClassButton}>＋ Create a class</span></span></> : <>＋ Create a class<span>Invite students using one link</span></>}</summary><CreateClass /></details>
      <div className={styles.classGrid}>{classrooms.map(classroom => <article className={styles.classCard} key={classroom.id}><div className={styles.classCardHeader}><div className={styles.classIdentity}><span className={styles.classBadge} aria-hidden="true">▦</span><div><h3>{classroom.name}</h3><p>{classroom.enrollments.length} {classroom.enrollments.length === 1 ? "student" : "students"} joined</p></div></div><ShareClass code={classroom.joinCode} /></div><details className={styles.classMembers} open={!!expandedStudent && classroom.enrollments.some(({ student }) => student.id === expandedStudent) || undefined}><summary>Students <span>· {classroom.enrollments.length}</span></summary>{classroom.enrollments.length ? <ul>{classroom.enrollments.map(({ student }) => { const record = records.get(student.id); return record ? studentRecord(record, classroom.id) : null; })}</ul> : <p>No students have joined this class yet.</p>}</details></article>)}</div>
    </section>
    <div className={styles.recordsColumn}>{unassigned.length > 0 && <section className={styles.listSection} aria-labelledby="unassigned-students"><div className={styles.listHeader}><div><p className={styles.eyebrow}>02 / STUDENT RECORDS</p><h2 id="unassigned-students">Students without a class</h2><p className={styles.listDescription}>Manually added or linked records that have not joined one of your classes.</p></div><span className={styles.counter}>{unassigned.length} {unassigned.length === 1 ? "STUDENT" : "STUDENTS"}</span></div><ul className={`${styles.list} ${styles.unassignedRecords}`}>{unassigned.map(student => studentRecord(student, "unassigned"))}</ul></section>}
    <details className={styles.manageRecords}><summary>Manage student records <span>Manually add or link a record</span></summary><div className={styles.toolGrid}><details className={styles.tool}><summary>＋ Add a student manually<span>Create a record for a student without an account</span></summary><CreateStudentForm /></details><details className={styles.tool}><summary>↗ Link an existing student record<span>Use an existing record sharing code</span></summary><LinkStudentForm /></details></div></details></div></div>
  </div>;
}
