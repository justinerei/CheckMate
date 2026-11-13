import { paperProgress } from "@/lib/paper-progress";
import Link from "next/link";
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
    include: { quiz: true, submissions: { orderBy: { createdAt: "asc" }, include: { pages: true } } },
  });
  if (!batch) notFound();
  const active = batch.submissions.some(p => p.status === "IN_REVIEW" && p.pages.some(page => page.status === "PENDING" || page.status === "PROCESSING" || (page.status === "FAILED" && page.retryAt)));
  const finalized = batch.submissions.filter(p => p.status === "FINALIZED").length;
  const full = batch.submissions.length >= 5;

  return <main className={styles.shell}>
    <header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href={`/quizzes/${encodeURIComponent(batch.quizId)}/overview`} className={styles.back}>← Back to quiz</Link></header>
    <div className={styles.content}>
      <div className={styles.heading}><div><p className={styles.kicker}>Checking papers</p><h1>{batch.quiz.title}</h1><p className={styles.intro}>Add papers as you go. Checking continues while you work.</p></div><div className={styles.count}><strong>{batch.submissions.length}<span> / 5</span></strong><span>papers in this batch</span></div></div>
      <Refresh active={active} />
      <section className={styles.workspace} aria-labelledby="batch-papers">
        <div className={styles.sectionHeader}><div><h2 id="batch-papers">Papers</h2><p>{finalized} finalized · {batch.submissions.length - finalized} in progress</p></div>{!full && <span className={styles.capacity}>{5 - batch.submissions.length} {5 - batch.submissions.length === 1 ? "spot" : "spots"} left</span>}</div>
        <div className={styles.list}>
          {batch.submissions.map((paper, index) => {
            const failed = paper.pages.some(p => p.status === "FAILED" && !p.retryAt);
            const complete = paper.pages.length === paper.expectedPages && paper.pages.every(p => p.status === "COMPLETE");
            const progress = paperProgress(paper.status, paper.expectedPages, paper.pages);
            const state = progress.label;
            const action = progress.action;
            const href = progress.review ? `/submissions/${paper.id}/review` : `/submissions/${paper.id}`;
            const stateClass = failed ? styles.attention : paper.status === "FINALIZED" || complete ? styles.ready : styles.pending;
            return <article className={styles.row} key={paper.id}>
              <span className={styles.paperNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.paperDetails}><h3>{paper.paperName || `Paper ${index + 1}`}</h3><p>{paper.pages.filter(p => p.status === "COMPLETE").length} of {paper.expectedPages ?? "?"} pages read{paper.status === "FINALIZED" && paper.totalScore !== null ? ` · ${paper.totalScore.toString()} points` : ""}</p></div>
              <span className={`${styles.status} ${stateClass}`}><span aria-hidden="true" />{state}</span>
              <Link className={styles.rowAction} href={href}>{action}<span aria-hidden="true"> →</span></Link>
              <DeleteControl batchId={id} paperId={paper.id} name={paper.paperName || `Paper ${index + 1}`} />
            </article>;
          })}
        </div>
        <div className={styles.addArea}>{full ? <p>Batch full. Start another batch for more papers.</p> : <><AddPaper id={id} /><p>Up to 3 pages per paper</p></>}</div>
      </section>
      <footer className={styles.footer}><DeleteControl batchId={id} papers={batch.submissions.map(paper => ({ id: paper.id, status: paper.status }))} /><Link href={`/submissions/new?quizId=${encodeURIComponent(batch.quizId)}`}>Start another batch</Link></footer>
    </div>
  </main>;
}
