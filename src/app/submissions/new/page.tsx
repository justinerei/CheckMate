import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import CreateForm from "./create-form";
import styles from "../submissions.module.css";

export const instant = false;
export default async function NewSubmission() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const [quizzes, students] = await Promise.all([
    db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.teacherStudent.findMany({ where: { teacherId: teacher.id }, orderBy: { student: { name: "asc" } }, select: { student: { select: { id: true, name: true } } } }),
  ]);
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href="/submissions" className={styles.back}>← Submissions</Link></header><div className={styles.narrow}><p className={styles.eyebrow}>NEW SUBMISSION / 01</p><h1>Whose paper?</h1><p className={styles.description}>Choose the quiz and student, then upload photos of their answered paper.</p><CreateForm quizzes={quizzes.map(q => ({ id: q.id, label: q.title }))} students={students.map(({ student }) => ({ id: student.id, label: student.name }))} /></div></main>;
}
