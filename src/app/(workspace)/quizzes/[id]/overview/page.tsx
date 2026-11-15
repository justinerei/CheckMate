import { summarizeResults } from "@/lib/quiz-results-summary";
import { paperProgress } from "@/lib/paper-progress";
import { paperReviewSummary } from "@/lib/paper-review-summary";
import { builtAnswerStyle } from "@/lib/built-review";
import Link from "next/link";
import Mascot from "@/app/mascot";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { paperDestination } from "@/lib/workspace-navigation";
import styles from "@/app/quizzes/[id]/overview/quiz-overview.module.css";
import BatchDeletedDialog from "@/app/quizzes/[id]/overview/batch-deleted-dialog";
import PaperList from "@/app/quizzes/[id]/overview/paper-list";
import DeleteQuiz from "@/app/quizzes/[id]/overview/delete-quiz";

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
      _count: { select: { submissions: true } },
      sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } },
      batches: { where: { teacherId: teacher.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { submissions: { where: { teacherId: teacher.id } } } } } },
      submissions: { where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" }, include: { student: true, pages: { select: { status: true, retryAt: true, extraction: true, pageNumber: true } }, answers: true } },
    },
  });
  if (!quiz) notFound();
  const questions = quiz.sections.flatMap(section => section.questions);
  const maximum = questions.reduce((sum, question) => sum + Number(question.points), 0);
  let reviewNumber = 0;
  const reviewQuestions = quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: quiz.numbering === "CONTINUOUS" ? ++reviewNumber : position + 1, section: index + 1, instructions: section.instructions, answerStyle: quiz.source === "BUILT" ? builtAnswerStyle(question.type) : section.answerStyle })));

  const finalized = quiz.submissions.filter(paper => paper.status === "FINALIZED").length;
  const scoredPapers = await db.submission.findMany({ where: { quizId: id, teacherId: teacher.id, status: "FINALIZED", quiz: { teacherId: teacher.id } }, select: { status: true, totalScore: true, answers: { select: { questionId: true, objectiveScore: true, teacherScore: true, instructionDecision: true } } } });
  const summary = summarizeResults(questions.map(question => ({ id: question.id, maximum: Number(question.points), type: question.type })), scoredPapers.map(paper => ({ status: paper.status, score: paper.totalScore === null ? null : Number(paper.totalScore), answers: paper.answers.map(answer => ({ ...answer, objectiveScore: answer.objectiveScore === null ? null : Number(answer.objectiveScore), teacherScore: answer.teacherScore === null ? null : Number(answer.teacherScore) })) })), maximum);
  let summaryNumber = 0;
  const summaryQuestions = quiz.sections.flatMap((section, sectionIndex) => section.questions.map((question, position) => ({ id: question.id, label: quiz.numbering === "CONTINUOUS" ? `Question ${++summaryNumber}` : `${section.title || `Section ${sectionIndex + 1}`} · Question ${position + 1}`, text: quiz.source === "BUILT" ? question.text : "" })));
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  let questionNumber = 0;
  return <><div className={styles.page}>
    {batchDeleted === "1" && <BatchDeletedDialog quizId={id} />}
    <Link href="/quizzes" className="back-navigation">All quizzes</Link>
    <header className={styles.header}><div><p className={styles.eyebrow}>{quiz.source === "EXISTING" ? "Saved answer key" : "Created in CheckMate"}</p><h1>{quiz.title}</h1><p>{questions.length} {questions.length === 1 ? "question" : "questions"} · {maximum} points</p></div><div className={styles.headerActions}>{quiz.source === "BUILT" && <>{quiz._count.submissions === 0 && <Link className={styles.secondaryAction} href={`/quizzes/${encodeURIComponent(id)}`}>Edit quiz</Link>}<Link className={styles.secondaryAction} href={`/quizzes/${encodeURIComponent(id)}/print?from=overview`}>Preview &amp; print</Link></>}<Link className={styles.primary} href={`/submissions/new?quizId=${encodeURIComponent(id)}`}>+ Upload papers</Link></div></header>
    <section className={styles.section} aria-labelledby="papers-heading"><div className={styles.sectionHeading}><div><h2 id="papers-heading">Student papers</h2><p>{finalized} finalized · {quiz.submissions.length - finalized} in progress</p></div>{finalized > 0 && <a className={styles.exportResults} href={`/api/quizzes/${encodeURIComponent(id)}/results`}>Export finalized scores · CSV</a>}</div>
      {quiz.submissions.length ? <PaperList papers={quiz.submissions.map(paper => { const read = !!paper.expectedPages && paper.pages.length === paper.expectedPages && paper.pages.every(page => page.status === "COMPLETE"); const progress = paperProgress(paper.status, paper.expectedPages, paper.pages, paper.status === "IN_REVIEW" ? paperReviewSummary(paper, reviewQuestions, quiz.source) : undefined); return { id: paper.id, name: paper.paperName || paper.student?.name || "Unnamed paper", linkedName: paper.student?.name ?? null, status: paper.status, statusLabel: progress.label, updated: date.format(paper.updatedAt), score: paper.status === "FINALIZED" && paper.totalScore !== null ? `${paper.totalScore.toString()} / ${maximum}` : "—", href: paperDestination(paper.id, paper.status, read || progress.review, "quiz") }; })} /> : <div className={`${styles.empty} ${styles.emptyWithMate}`}><Mascot state="empty" width={96} height={96} className={styles.emptyMate} /><div><strong>No papers yet</strong><p>Upload the first student paper when you’re ready.</p><Link href={`/submissions/new?quizId=${encodeURIComponent(id)}`}>Upload papers →</Link></div></div>}
    </section>
    <section className={styles.section} aria-labelledby="results-summary-heading"><div className={styles.sectionHeading}><div><h2 id="results-summary-heading">Results summary</h2><p>Based on finalized papers only. Papers in review are excluded.</p></div></div>
      {summary.paperCount ? <div className={styles.resultsSummary}><div className={styles.resultsMetrics}><div><span>FINALIZED PAPERS WITH SCORES</span><strong>{summary.paperCount}</strong></div><div><span>AVERAGE SCORE</span><strong>{summary.average} <small>/ {maximum}</small></strong></div></div>
        {maximum > 0 && <div className={styles.resultsBands}><h3>Score distribution</h3><p>Score ranges, not passing grades.</p><div>{summary.bands.map(band => <div key={band.label}><span>{band.label}</span><strong>{band.count} {band.count === 1 ? "paper" : "papers"}</strong></div>)}</div></div>}
        <details className={styles.itemResults}><summary>View question averages</summary><p>Average points earned per question. Counts exclude missing scores; essays use teacher-confirmed points.</p><div className={styles.resultsTableWrap}><table><thead><tr><th scope="col">Question</th><th scope="col">Scored papers</th><th scope="col">Average points</th></tr></thead><tbody>{summary.items.map((item, index) => <tr key={item.id}><th scope="row"><span>{summaryQuestions[index].label}</span>{summaryQuestions[index].text && <small>{summaryQuestions[index].text}</small>}</th><td>{item.count} / {summary.paperCount}</td><td>{item.average === null ? "—" : `${item.average} / ${item.maximum}`}{item.percent !== null && <small>{item.percent}%</small>}</td></tr>)}</tbody></table></div></details>
      </div> : <div className={`${styles.empty} ${quiz.submissions.length ? styles.emptyWithMate : ""}`}>{quiz.submissions.length > 0 && <Mascot state="empty" width={96} height={96} className={styles.emptyMate} />}<div><strong>No finalized scores yet</strong><p>Finalize a paper to see score distribution and question averages.</p></div></div>}
    </section>
    {quiz.batches.length > 0 && <section className={styles.section} aria-labelledby="batches-heading"><div className={styles.sectionHeading}><div><h2 id="batches-heading">Batches</h2><p>Continue adding or checking papers.</p></div></div><div className={styles.batches}>{quiz.batches.map((batch, index) => <Link className={styles.batch} href={`/batches/${encodeURIComponent(batch.id)}`} key={batch.id}><span><strong>Batch {quiz.batches.length - index}</strong><small>{date.format(batch.createdAt)} · {batch._count.submissions} of 5 papers</small></span><span aria-hidden="true">→</span></Link>)}</div></section>}
    <section className={styles.section}><div className={styles.answerKey}><details className={styles.keyDisclosure}><summary><span><strong>Answer key</strong><small>{questions.length} questions · {maximum} points</small></span><span className={styles.showKey}>View key</span></summary><div className={styles.keyContent}>{quiz.sections.length ? quiz.sections.map(section => <section className={styles.keySection} key={section.id}><h3>{section.title}</h3>{section.instructions && <p>{section.instructions}</p>}<ol>{section.questions.map((question, position) => { const number = quiz.numbering === "CONTINUOUS" ? ++questionNumber : position + 1; return <li key={question.id}><span>{number}.</span><strong>{question.type === "ESSAY" ? "Teacher-scored essay" : question.answerKey?.acceptedAnswers.join(" / ") || "Answer missing"}</strong><small>{question.points.toString()} pts</small></li>; })}</ol></section>) : <p>No questions added yet.</p>}</div></details>
      <div className={styles.keyActions}><Link className={styles.secondaryAction} href={`/quizzes/${encodeURIComponent(id)}/answer-key/print`}>Print answer key</Link><Link className={styles.secondaryAction} href={`/quizzes/existing/${encodeURIComponent(id)}/edit`}>Edit correct answers</Link></div></div>
    </section>
    <DeleteQuiz id={id} title={quiz.title} hasPapers={quiz._count.submissions > 0} hasBatches={quiz.batches.length > 0} archived={!!quiz.archivedAt} />
  </div></>;
}
