import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import CreateForm from "./create-form";
import styles from "../submissions.module.css";

export const instant = false;
export default async function NewSubmission({ searchParams }: { searchParams: Promise<{ quizId?: string; saved?: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { quizId, saved } = await searchParams;
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { title: "asc" }, select: { id: true, title: true } });
  const selected = quizzes.some(q => q.id === quizId);
  return <main className={styles.shell}>
    <header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href={selected ? `/quizzes/${encodeURIComponent(quizId!)}/overview` : "/dashboard"} className="back-navigation">{selected ? "Back to quiz" : "Back to dashboard"}</Link></header>
    <div className={styles.narrow}>
      <p className={styles.eyebrow}>CHECK PAPERS</p><h1>Start checking</h1>
      {saved === "1" && selected && <p className={styles.success} role="status">Answer key saved. Next, upload the student’s paper.</p>}
      {quizzes.length > 0 && <section className={styles.savedKeySection} aria-labelledby="saved-key-heading">
        <h2 id="saved-key-heading">Use a saved answer key or quiz</h2>
        <p className={styles.description}>Choose a saved key, then add your first paper. A batch can hold up to five papers.</p>
        <CreateForm selectedQuizId={selected ? quizId : undefined} quizzes={quizzes.map(q => ({ id: q.id, label: q.title }))} />
      </section>}
      <section className={styles.uploadKeyChoice} aria-labelledby="upload-key-heading">
        {quizzes.length > 0 && <div className={styles.keyDivider}><span>OR</span></div>}
        <h2 id="upload-key-heading">Have a new answer key?</h2>
        <p>Upload a photo or PDF, or enter the answers manually.</p>
        <Link className={styles.secondary} href="/quizzes/existing?from=check">Upload answer key <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  </main>;
}
