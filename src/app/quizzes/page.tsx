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
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, source: true, updatedAt: true, _count: { select: { sections: true } } } });
  const keys = quizzes.filter(quiz => quiz.source === "EXISTING");
  const created = quizzes.filter(quiz => quiz.source !== "EXISTING");
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  function listing(items: typeof quizzes, kind: "key" | "quiz") {
    return <div className={styles.list}>{items.map(item => <div className={styles.libraryRow} key={item.id}>
      <Link className={styles.libraryMain} href={quizDestination(item.id, item.source)}><span className={styles.rowIcon} aria-hidden="true">{kind === "key" ? "▤" : "▦"}</span><span className={styles.rowMain}><strong>{item.title}</strong><small>{kind === "key" ? "Saved answer key" : "Quiz made in CheckMate"} · {item._count.sections} {item._count.sections === 1 ? "section" : "sections"}</small></span><time dateTime={item.updatedAt.toISOString()}>Updated {date.format(item.updatedAt)}</time><span className={styles.rowAction}>{kind === "key" ? "View key" : "Open quiz"} <span aria-hidden="true">↗</span></span></Link>
      <Link className={styles.libraryCheck} href={`/submissions/new?quizId=${encodeURIComponent(item.id)}`}>Check a paper <span aria-hidden="true">↗</span></Link>
    </div>)}</div>;
  }
  return <WorkspaceFrame active="quizzes" teacherId={teacher.id}>
    <header className={styles.pageHeader}><div><span className={styles.eyebrow}>YOUR WORKSPACE / LIBRARY</span><h1>My quizzes &amp; keys.</h1><p>Find your saved answer keys and quizzes here. Choose one to check a student’s paper.</p></div><div className={styles.pageActions}><Link className={styles.buttonSecondary} href="/quizzes/existing">+ Add an answer key</Link><Link className={styles.button} href="/quizzes/new">+ Create a quiz</Link></div></header>
    <section className={styles.listSection} aria-labelledby="answer-keys-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>01 / FOR EXISTING QUIZZES</span><h2 id="answer-keys-heading">Answer keys <span className={styles.libraryCount}>{keys.length}</span></h2><p>Keys you uploaded or entered for quizzes made elsewhere. Open one to see its answers.</p></div></div>{keys.length ? listing(keys, "key") : <div className={styles.empty}><strong>No saved answer keys yet</strong><p>Add an answer key to check a quiz made outside CheckMate.</p><Link href="/quizzes/existing">Add an answer key ↗</Link></div>}</section>
    <section className={styles.listSection} aria-labelledby="created-quizzes-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>02 / MADE IN CHECKMATE</span><h2 id="created-quizzes-heading">Created quizzes <span className={styles.libraryCount}>{created.length}</span></h2><p>Quizzes you made in CheckMate, along with their answer keys.</p></div></div>{created.length ? listing(created, "quiz") : <div className={styles.empty}><strong>No created quizzes yet</strong><p>Use the quiz maker if you want to create a new quiz in CheckMate.</p><Link href="/quizzes/new">Create a quiz ↗</Link></div>}</section>
  </WorkspaceFrame>;
}
