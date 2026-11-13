import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { quizDestination } from "@/lib/workspace-navigation";
import WorkspaceFrame from "../workspace-frame";
import styles from "../workspace-content.module.css";

export const instant = false;
export default async function Quizzes() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, source: true, updatedAt: true, _count: { select: { sections: true, submissions: true } } } });
  const keys = quizzes.filter(quiz => quiz.source === "EXISTING");
  const created = quizzes.filter(quiz => quiz.source !== "EXISTING");
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  function listing(items: typeof quizzes, kind: "key" | "quiz") {
    return <div className={styles.quizGrid}>{items.map(item => <Link className={styles.quizCard} href={quizDestination(item.id, item.source)} key={item.id}>
      <span className={styles.cardTop}><span className={styles.rowIcon} aria-hidden="true">{kind === "key" ? "▤" : "▦"}</span><span aria-hidden="true">↗</span></span>
      <strong>{item.title}</strong><span className={styles.cardMeta}>{kind === "key" ? "Existing quiz" : "Created quiz"} · {item._count.submissions} {item._count.submissions === 1 ? "paper" : "papers"}</span><span className={styles.cardFooter}>Updated {date.format(item.updatedAt)} <span>Open quiz →</span></span>
    </Link>)}</div>;
  }
  return <WorkspaceFrame active="quizzes" teacherId={teacher.id}>
    <header className={styles.pageHeader}><div><span className={styles.eyebrow}>YOUR WORKSPACE / LIBRARY</span><h1>My quizzes &amp; keys.</h1><p>Find your saved answer keys and quizzes here. Choose one to check a student’s paper.</p></div><div className={styles.pageActions}><Link className={styles.buttonSecondary} href="/quizzes/existing">+ Add an answer key</Link><Link className={styles.button} href="/quizzes/new">+ Create a quiz</Link></div></header>
    <section className={styles.listSection} aria-labelledby="answer-keys-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>01 / FOR EXISTING QUIZZES</span><h2 id="answer-keys-heading">Answer keys <span className={styles.libraryCount}>{keys.length}</span></h2><p>Keys you uploaded or entered for quizzes made elsewhere. Open one to view its answers and student papers.</p></div></div>{keys.length ? listing(keys, "key") : <div className={styles.empty}><strong>No saved answer keys yet</strong><p>Add an answer key to check a quiz made outside CheckMate.</p><Link href="/quizzes/existing">Add an answer key ↗</Link></div>}</section>
    <section className={styles.listSection} aria-labelledby="created-quizzes-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>02 / MADE IN CHECKMATE</span><h2 id="created-quizzes-heading">Created quizzes <span className={styles.libraryCount}>{created.length}</span></h2><p>Quizzes you made in CheckMate, along with their answer keys.</p></div></div>{created.length ? listing(created, "quiz") : <div className={styles.empty}><strong>No created quizzes yet</strong><p>Use the quiz maker if you want to create a new quiz in CheckMate.</p><Link href="/quizzes/new">Create a quiz ↗</Link></div>}</section>
  </WorkspaceFrame>;
}
