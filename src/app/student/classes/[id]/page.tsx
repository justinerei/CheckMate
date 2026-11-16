import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { releasedStudentResults } from "@/lib/student-portal";
import StudentShell from "../../student-shell";
import { studentUser } from "../../student-data";
import ResultList from "../../result-list";
import styles from "../../student-workspace.module.css";

export const instant = false;
export default async function StudentClassPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await studentUser();
  const { id } = await params;
  const enrollment = await db.classEnrollment.findFirst({ where: { classroomId: id, student: { accountId: user.id } }, select: { classroom: { select: { name: true, teacher: { select: { name: true } } } } } });
  if (!enrollment) notFound();
  const papers = await db.submission.findMany({ where: { ...releasedStudentResults(user.id), classroomId: id }, orderBy: { releasedAt: "desc" }, select: { id: true, totalScore: true, releasedAt: true, quiz: { select: { title: true, sections: { select: { questions: { select: { points: true } } } } } } } });
  const results = papers.map(paper => ({ id: paper.id, title: paper.quiz.title, score: paper.totalScore?.toString() ?? "—", maximum: Math.round(paper.quiz.sections.flatMap(section => section.questions).reduce((sum, question) => sum + Number(question.points), 0) * 100) / 100, releasedAt: paper.releasedAt?.toISOString() ?? "" }));
  return <StudentShell email={user.email} active="classes"><div className={styles.content}><Link className={styles.link} href="/student/classes">← My classes</Link><header className={styles.welcome}><h1>{enrollment.classroom.name}.</h1><p>{enrollment.classroom.teacher.name} · {results.length} released {results.length === 1 ? "paper" : "papers"}</p></header><section className={styles.section}><div className={styles.sectionHeading}><div><h2>Released papers</h2><p>Results your teacher linked to this class.</p></div></div><ResultList results={results} /></section></div></StudentShell>;
}
