import { paperProgress } from "@/lib/paper-progress";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { paperDestination } from "@/lib/workspace-navigation";
import WorkspaceFrame from "../../../workspace-frame";
import styles from "./quiz-overview.module.css";
import BatchDeletedDialog from "./batch-deleted-dialog";

export const instant = false;

export default async function QuizOverview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ batchDeleted?: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const { batchDeleted } = await searchParams;
  const quiz = await db.quiz.findFirst({
    where: { id, teacherId: teacher.id },
    include: {
      sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } },
      batches: { where: { teacherId: teacher.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { submissions: { where: { teacherId: teacher.id } } } } } },
      submissions: { where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" }, include: { student: true, pages: { select: { status: true, retryAt: true } } } },
    },
  });
  if (!quiz) notFound();
  const questions = quiz.sections.flatMap(section => section.questions);
  const maximum = questions.reduce((sum, question) => sum + Number(question.points), 0);
  const finalized = quiz.submissions.filter(paper => paper.status === "FINALIZED").length;
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  let questionNumber = 0;
  return <WorkspaceFrame active="quizzes" teacherId={teacher.id}><div className={styles.page}>
    {batchDeleted === "1" && <BatchDeletedDialog quizId={id} />}
    <Link href="/quizzes" className="back-navigation">All quizzes</Link>
    <header className={styles.header}><div><p className={styles.eyebrow}>{quiz.source === "EXISTING" ? "Saved answer key" : "Created in CheckMate"}</p><h1>{quiz.title}</h1><p>{questions.length} {questions.length === 1 ? "question" : "questions"} · {maximum} points</p></div><Link className={styles.primary} href={`/submissions/new?quizId=${encodeURIComponent(id)}`}>+ Upload papers</Link></header>
    <section className={styles.section} aria-labelledby="papers-heading"><div className={styles.sectionHeading}><div><h2 id="papers-heading">Student papers</h2><p>{finalized} finalized · {quiz.submissions.length - finalized} in progress</p></div>{finalized > 0 && <a className={styles.exportResults} href={`/api/quizzes/${encodeURIComponent(id)}/results`}>Export finalized scores · CSV</a>}</div>
      {quiz.submissions.length ? <div className={styles.paperList}>{quiz.submissions.map(paper => {
        const read = !!paper.expectedPages && paper.pages.length === paper.expectedPages && paper.pages.every(page => page.status === "COMPLETE");
        const status = paperProgress(paper.status, paper.expectedPages, paper.pages).label;
        return <Link className={styles.paper} href={paperDestination(paper.id, paper.status, read)} key={paper.id}><span className={styles.paperIcon} aria-hidden="true">▤</span><span className={styles.paperName}><strong>{paper.paperName || paper.student?.name || "Unnamed paper"}</strong><small>Updated {date.format(paper.updatedAt)}</small></span><span className={styles.status}>{status}</span><span className={styles.score}>{paper.status === "FINALIZED" && paper.totalScore !== null ? `${paper.totalScore.toString()} / ${maximum}` : "—"}</span><span className={styles.arrow} aria-hidden="true">→</span></Link>;
      })}</div> : <div className={styles.empty}><strong>No papers yet</strong><p>Upload the first student paper when you’re ready.</p><Link href={`/submissions/new?quizId=${encodeURIComponent(id)}`}>Upload papers →</Link></div>}
    </section>
    {quiz.batches.length > 0 && <section className={styles.section} aria-labelledby="batches-heading"><div className={styles.sectionHeading}><div><h2 id="batches-heading">Batches</h2><p>Continue adding or checking papers.</p></div></div><div className={styles.batches}>{quiz.batches.map((batch, index) => <Link className={styles.batch} href={`/batches/${encodeURIComponent(batch.id)}`} key={batch.id}><span><strong>Batch {quiz.batches.length - index}</strong><small>{date.format(batch.createdAt)} · {batch._count.submissions} of 5 papers</small></span><span aria-hidden="true">→</span></Link>)}</div></section>}
    <section className={styles.section}><details className={styles.answerKey}><summary><span><strong>Answer key</strong><small>{questions.length} questions · {maximum} points</small></span><span className={styles.showKey}>View key</span></summary><div className={styles.keyContent}>{quiz.sections.length ? quiz.sections.map(section => <section className={styles.keySection} key={section.id}><h3>{section.title}</h3>{section.instructions && <p>{section.instructions}</p>}<ol>{section.questions.map((question, position) => { const number = quiz.numbering === "CONTINUOUS" ? ++questionNumber : position + 1; return <li key={question.id}><span>{number}.</span><strong>{question.type === "ESSAY" ? "Teacher-scored essay" : question.answerKey?.acceptedAnswers.join(" / ") || "Answer missing"}</strong><small>{question.points.toString()} pts</small></li>; })}</ol></section>) : <p>No questions added yet.</p>}</div></details>
      <div className={styles.quizActions}>{quiz.source === "EXISTING" ? <Link href={`/quizzes/existing/${encodeURIComponent(id)}/edit`}>Edit correct answers</Link> : <><Link href={`/quizzes/${encodeURIComponent(id)}`}>Edit quiz</Link><Link href={`/quizzes/existing/${encodeURIComponent(id)}/edit`}>Edit correct answers</Link><Link href={`/quizzes/${encodeURIComponent(id)}/print`}>Preview &amp; print</Link></>}</div>
    </section>
  </div></WorkspaceFrame>;
}
