import { builtAnswerStyle } from "@/lib/built-review";
import { batchCheckingStatus, paperProgress } from "@/lib/paper-progress";
import { batchMascotState } from "@/lib/mascot-context";
import { RetryTime } from "@/app/retry-time";
import { paperReviewSummary } from "@/lib/paper-review-summary";
import Link from "next/link";
import ReadingProgress from "@/app/reading-progress";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import AddPaper from "./add-paper";
import Refresh from "./refresh";
import DeleteControl from "./delete-control";
import styles from "./batch.module.css";

export const instant = false;

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const batch = await db.checkingBatch.findFirst({
    where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id } },
    include: { quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } }, submissions: { orderBy: { createdAt: "asc" }, include: { pages: true, answers: true } } },
  });
  if (!batch) notFound();
  let number = 0;
  const questions = batch.quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: batch.quiz.numbering === "CONTINUOUS" ? ++number : position + 1, section: index + 1, instructions: section.instructions, answerStyle: batch.quiz.source === "BUILT" ? builtAnswerStyle(question.type) : section.answerStyle })));
  const maximum = questions.reduce((sum, question) => sum + Number(question.points), 0);
  const active = batch.submissions.some(p => p.status === "IN_REVIEW" && p.pages.some(page => page.status === "PENDING" || page.status === "PROCESSING" || (page.status === "FAILED" && page.retryAt)));
  const activePages = batch.submissions.filter(p => p.status === "IN_REVIEW").flatMap(p => p.pages);
  const checking = batchCheckingStatus(activePages);
  const progressLabel = checking.kind === "reading" ? "Reading a page" : checking.kind === "rate_limit" ? "AI rate limit reached" : "Pages queued for checking";
  const finalized = batch.submissions.filter(p => p.status === "FINALIZED").length;
  const full = batch.submissions.length >= 5;

  return <main className={styles.shell}>
    <div className={styles.content}>
      <div className="teacher-page-back"><Link href={`/quizzes/${encodeURIComponent(batch.quizId)}/overview`} className="back-navigation">Back to quiz</Link></div>
      <div className={styles.heading}><div><h1>Checking papers</h1><p className={styles.intro}>{batch.quiz.title} · Batch of student papers</p></div></div>
      <Refresh active={active} />
      <ReadingProgress papers={batch.submissions} label="Batch reading progress" showMascot={!active} notice={active ? { title: progressLabel, mascot: batchMascotState(checking.kind), description: checking.kind === "rate_limit" ? <>The checker temporarily reached a rate limit. Checking will retry automatically after <RetryTime value={checking.retryAt} />. Keep the app server running.</> : checking.kind === "reading" ? "A page is being read. Other pages will wait their turn." : "Pages are waiting for the background checker. Keep the app server running." } : undefined} />
      <section className={styles.workspace} aria-labelledby="batch-papers">
        <div className={styles.sectionHeader}><div><h2 id="batch-papers">Papers</h2><p>{finalized} finalized · {batch.submissions.length - finalized} in progress</p></div><span className={styles.capacity}>{batch.submissions.length} of 5 papers</span></div>
        <div className={styles.list}><div className={styles.listHead} aria-hidden="true"><span>Paper</span><span>Status</span><span>Action</span></div>
          {batch.submissions.map((paper, index) => {
            const failed = paper.pages.some(p => p.status === "FAILED" && !p.retryAt);
            const complete = paper.pages.length === paper.expectedPages && paper.pages.every(p => p.status === "COMPLETE");
            const summary = paper.status === "IN_REVIEW" ? paperReviewSummary(paper, questions, batch.quiz.source) : null;
            const progress = paperProgress(paper.status, paper.expectedPages, paper.pages, summary ?? undefined);
            const flagged = summary?.flagged ?? 0;
            const unmatchedBlocked = summary?.unmatchedBlocked ?? false;
            const proposed = summary?.proposed ?? 0;
            const backgroundState = ["Checking", "Waiting to be checked", "Waiting for AI retry"].includes(progress.label);
            const state = progress.label;
            const action = progress.action;
            const href = progress.review ? `/submissions/${encodeURIComponent(paper.id)}/review?from=batch` : `/submissions/${encodeURIComponent(paper.id)}?from=batch`;
            const stateClass = progress.label === "Ready to finalize" || paper.status === "FINALIZED" ? styles.ready : failed || (complete && paper.status === "IN_REVIEW" && (flagged > 0 || unmatchedBlocked || !paper.nameReviewed)) ? styles.attention : styles.pending;
            return <article className={styles.row} key={paper.id}>
              <span className={styles.paperNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.paperDetails}><h3>{paper.paperName || `Paper ${index + 1}`}</h3><p>{paper.pages.filter(p => p.status === "COMPLETE").length} of {paper.expectedPages ?? "?"} pages read</p></div>
              <div className={styles.reviewInfo}><span className={`${styles.status} ${stateClass} ${backgroundState ? styles.backgroundStatus : ""}`}><span aria-hidden="true" />{state}</span>
                {paper.status === "FINALIZED" && paper.totalScore !== null && <p className={styles.score}>Final score: {paper.totalScore.toString()} / {maximum}</p>}
                {paper.status === "IN_REVIEW" && complete && <><p className={styles.score}>{flagged ? `Score pending · ${flagged} ${flagged === 1 ? "answer needs" : "answers need"} review` : `Proposed score: ${proposed} / ${maximum}`}</p>{unmatchedBlocked && <p className={styles.reviewNote}>Unmatched reading · verify all answers</p>}{!paper.nameReviewed && <p className={styles.reviewNote}>Student name needs confirmation</p>}</>}
              </div>
              <Link className={styles.rowAction} href={href}>{action}<span aria-hidden="true"> →</span></Link>
              <DeleteControl batchId={id} paperId={paper.id} name={paper.paperName || `Paper ${index + 1}`} />
            </article>;
          })}
        </div>
        <div className={styles.addArea}>{full ? <p>Batch full. Start another batch for more papers.</p> : <><AddPaper id={id} /><p>{5 - batch.submissions.length} {5 - batch.submissions.length === 1 ? "spot" : "spots"} left · Up to 3 pages per paper</p></>}</div>
      </section>
      <footer className={styles.footer}><DeleteControl batchId={id} papers={batch.submissions.map(paper => ({ id: paper.id, status: paper.status }))} /><Link className={styles.newBatchLink} href={`/submissions/new?quizId=${encodeURIComponent(batch.quizId)}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>Start another batch</Link></footer>
    </div>
  </main>;
}
