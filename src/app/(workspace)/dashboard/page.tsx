import { paperProgress } from "@/lib/paper-progress";
import { paperReviewSummary } from "@/lib/paper-review-summary";
import { builtAnswerStyle } from "@/lib/built-review";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { paperDestination, quizDestination } from "@/lib/workspace-navigation";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Mascot from "@/app/mascot";
import LibraryIcon from "@/app/library-icon";
import styles from "@/app/workspace-content.module.css";

export const instant = false;
export default async function Dashboard() {
  await connection();
  const teacher = await getTeacher(); if (!teacher) redirect("/");
  const paperWhere = { teacherId: teacher.id, quiz: { teacherId: teacher.id } };
  const [user, quizCount, inReview, finalized, quizzes, papers] = await Promise.all([
    db.user.findUnique({ where: { id: teacher.id }, select: { name: true } }),
    db.quiz.count({ where: { teacherId: teacher.id, archivedAt: null } }),
    db.submission.count({ where: { ...paperWhere, status: "IN_REVIEW" } }),
    db.submission.count({ where: { ...paperWhere, status: "FINALIZED" } }),
    db.quiz.findMany({ where: { teacherId: teacher.id, archivedAt: null }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, source: true, updatedAt: true, _count: { select: { sections: true } } } }),
    db.submission.findMany({ where: paperWhere, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, status: true, expectedPages: true, nameReviewed: true, pages: { select: { status: true, retryAt: true, extraction: true, pageNumber: true } }, answers: true, paperName: true, student: { select: { name: true } }, quiz: { select: { title: true, source: true, numbering: true, sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } } } }),
  ]);
  return <><div className={styles.overview}>

    <header className={styles.welcome}><h1>Hello, {user?.name.split(" ")[0] || "teacher"}.</h1><p>Ready when you are. Pick up where you left off or start something new.</p></header>
    <section className={styles.start} aria-labelledby="start-heading"><div className={styles.headingRow}><div><h2 id="start-heading">What would you like to do?</h2></div></div><div className={styles.actionGrid}>
      <Link href="/submissions/new" className={`${styles.action} ${styles.actionPrimary}`}><span className={styles.actionTop}><span className={styles.primaryArrow} aria-hidden="true">↗</span></span><strong>Check a paper</strong><span>Choose an answer key, upload a student paper, and review the results.</span><span className={styles.primaryCta}>Start checking <span aria-hidden="true">→</span></span></Link>
      <Link href="/quizzes" className={styles.action}><span className={styles.actionTop}><span className={styles.actionIcon} aria-hidden="true">▤</span><span aria-hidden="true">↗</span></span><strong>My quizzes and keys</strong><span>View answer keys and quizzes you’ve already saved.</span></Link>
      <Link href="/quizzes/new" className={styles.action}><span className={styles.actionTop}><span className={styles.actionIcon} aria-hidden="true">＋</span><span aria-hidden="true">↗</span></span><strong>Create a quiz</strong><span>Build a printable quiz in CheckMate.</span></Link>
    </div></section>
    <section className={styles.metrics} aria-label="Workspace summary"><div><span>MY QUIZZES</span><strong>{String(quizCount).padStart(2, "0")}</strong><small>Quizzes and answer keys</small></div><div><span>IN REVIEW</span><strong>{String(inReview).padStart(2, "0")}</strong><small>Papers in review</small></div><div><span>FINALIZED</span><strong>{String(finalized).padStart(2, "0")}</strong><small>Completed papers</small></div></section>
    <section className={styles.listSection} aria-labelledby="recent-papers"><div className={styles.headingRow}><div><h2 id="recent-papers">Recent papers</h2><p>Continue reviewing or revisit a result.</p></div><Link className={styles.viewAll} href="/quizzes">Browse quizzes <span aria-hidden="true">↗</span></Link></div>{papers.length ? <div className={styles.list}>{papers.map(paper => { const progress = paperProgress(paper.status, paper.expectedPages, paper.pages, dashboardReviewSummary(paper)); return <Link className={styles.row} href={paperDestination(paper.id, paper.status, progress.review, "dashboard")} key={paper.id}><span className={styles.rowIcon}><LibraryIcon type="paper" /></span><span className={styles.rowMain}><strong>{paper.paperName || paper.student?.name || "Unnamed paper"}</strong><small>{paper.quiz.title}</small></span><span className={styles.status}>{progress.label}</span><span className={styles.rowAction}>{paper.status === "FINALIZED" ? "View result" : "Continue"} <span aria-hidden="true">↗</span></span></Link>})}</div> : <div className={`${styles.empty} ${styles.emptyWithMate}`}><Mascot state="empty" width={112} height={112} className={styles.emptyMate} /><div><strong>No papers yet</strong><p>Upload a student paper when your quiz is ready.</p><Link href="/submissions/new">Check your first paper ↗</Link></div></div>}</section>
    <section className={styles.listSection} aria-labelledby="recent-quizzes"><div className={styles.headingRow}><div><h2 id="recent-quizzes">Recent quizzes</h2><p>Answer keys and quizzes you’ve worked on.</p></div><Link className={styles.viewAll} href="/quizzes">View all <span aria-hidden="true">↗</span></Link></div>{quizzes.length ? <div className={styles.list}>{quizzes.map(quiz => <Link className={styles.row} href={quizDestination(quiz.id, quiz.source)} key={quiz.id}><span className={styles.rowIcon}><LibraryIcon type={quiz.source === "EXISTING" ? "key" : "quiz"} /></span><span className={styles.rowMain}><strong>{quiz.title}</strong><small>{quiz.source === "EXISTING" ? "Existing answer key" : "Created in CheckMate"} · {quiz._count.sections} {quiz._count.sections === 1 ? "section" : "sections"}</small></span><time dateTime={quiz.updatedAt.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(quiz.updatedAt)}</time><span className={styles.rowAction}>Open <span aria-hidden="true">↗</span></span></Link>)}</div> : <div className={styles.empty}><strong>No quizzes yet</strong><p>Set up an existing quiz or create your own.</p><Link href="/quizzes/existing">Set up an existing quiz ↗</Link></div>}</section>
  </div></>;
}

function dashboardReviewSummary(paper: { status: string; expectedPages: number | null; nameReviewed: boolean; pages: { pageNumber: number; status: string; extraction: unknown }[]; answers: { questionId: string; reviewStatus: string; confirmedText: string | null; instructionDecision: string | null; objectiveScore: unknown; teacherScore: unknown }[]; quiz: { source: string; numbering: string; sections: { instructions: string; answerStyle: string; questions: { id: string; type: string; points: { toString(): string }; answerKey: { acceptedAnswers: string[] } | null }[] }[] } }) {
  if (paper.status !== "IN_REVIEW") return undefined;
  let number = 0;
  const questions = paper.quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: paper.quiz.numbering === "CONTINUOUS" ? ++number : position + 1, section: index + 1, instructions: section.instructions, answerStyle: paper.quiz.source === "BUILT" ? builtAnswerStyle(question.type) : section.answerStyle })));
  return paperReviewSummary(paper, questions, paper.quiz.source);
}
