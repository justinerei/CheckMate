import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import CreateForm from "./create-form";
import styles from "../submissions.module.css";

export const instant = false;
export default async function NewSubmission({ searchParams }: { searchParams: Promise<{ quizId?: string; saved?: string; choose?: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { quizId, saved, choose } = await searchParams;
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { title: "asc" }, select: { id: true, title: true } });
  const selected = quizzes.some(q => q.id === quizId);
  const selecting = selected || (choose === "saved" && quizzes.length > 0) || quizzes.length > 0;
  return <main className={styles.shell}>
    <header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href="/dashboard" className="back-navigation">Dashboard</Link></header>
    <div className={styles.narrow}>
      <p className={styles.eyebrow}>CHECK PAPERS</p><h1>Start checking</h1>
      {selecting ? <>
        {saved === "1" && selected && <p className={styles.success} role="status">Answer key saved. Next, upload the student’s paper.</p>}
        <p className={styles.description}>Choose a quiz, then add your first paper. You can add up to five papers to this batch.</p>
        <CreateForm selectedQuizId={selected ? quizId : undefined} quizzes={quizzes.map(q => ({ id: q.id, label: q.title }))} />
        <p className={styles.choiceBack}>Need to add an answer key? <Link href="/quizzes/existing?from=check">Set up an existing quiz</Link></p>
      </> : <>
        <p className={styles.description}>First, tell us whether you already have an answer key saved in CheckMate. You’ll upload the student’s paper next.</p>
        <div className={styles.checkChoices}>
          <Link className={styles.checkChoice} href="/quizzes/existing?from=check"><span className={styles.keyEyebrow}>NEW ANSWER KEY</span><strong>Set up an answer key</strong><span>Upload an existing key or enter answers manually. You can reuse it for other papers.</span><span className={styles.choiceAction}>Continue →</span></Link>
          {quizzes.length > 0 ? <Link className={styles.checkChoice} href="/submissions/new?choose=saved"><span className={styles.keyEyebrow}>SAVED ANSWER KEY</span><strong>Use a saved answer key</strong><span>Choose a key or a quiz you already set up in CheckMate.</span><span className={styles.choiceAction}>Choose a key →</span></Link> : <div className={`${styles.checkChoice} ${styles.choiceDisabled}`}><span className={styles.keyEyebrow}>SAVED ANSWER KEY</span><strong>Use a saved answer key</strong><span>No saved keys yet. Set one up first, then you can use it again.</span></div>}
        </div>
      </>}
    </div>
  </main>;
}
