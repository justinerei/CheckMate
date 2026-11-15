"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { matchesSearch } from "@/lib/list-filter";
import { quizDestination } from "@/lib/workspace-navigation";
import styles from "../workspace-content.module.css";

type Quiz = { id: string; title: string; source: string; archived: boolean; updated: string; papers: number };
export default function QuizLibrary({ quizzes }: { quizzes: Quiz[] }) {
  const [query, setQuery] = useState("");
  const visible = quizzes.filter(quiz => matchesSearch([quiz.title], query));
  const active = visible.filter(quiz => !quiz.archived);
  const archived = visible.filter(quiz => quiz.archived);
  const keys = active.filter(quiz => quiz.source === "EXISTING");
  const created = active.filter(quiz => quiz.source !== "EXISTING");
  function listing(items: Quiz[]) {
    return <div className={styles.quizGrid}>{items.map(item => <Link className={styles.quizCard} href={quizDestination(item.id, item.source)} key={item.id}>
      <span className={styles.cardTop}><span className={styles.rowIcon} aria-hidden="true">{item.source === "EXISTING" ? "▤" : "▦"}</span><span aria-hidden="true">↗</span></span>
      <strong>{item.title}</strong><span className={styles.cardMeta}>{item.source === "EXISTING" ? "Existing quiz" : "Created quiz"} · {item.papers} {item.papers === 1 ? "paper" : "papers"}</span><span className={styles.cardFooter}>Updated {item.updated} <span>Open quiz →</span></span>
    </Link>)}</div>;
  }
  return <><div className={styles.librarySearch}><label htmlFor="quiz-search">Search quizzes and keys</label><input id="quiz-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title" maxLength={120} /><p role="status">{visible.length} of {quizzes.length} {quizzes.length === 1 ? "quiz or key" : "quizzes and keys"} shown</p></div>
    <section className={styles.listSection} aria-labelledby="answer-keys-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>01 / FOR EXISTING QUIZZES</span><h2 id="answer-keys-heading">Answer keys <span className={styles.libraryCount}>{keys.length}</span></h2><p>Keys you uploaded or entered for quizzes made elsewhere. Open one to view its answers and student papers.</p></div></div>{keys.length ? listing(keys) : <div className={`${styles.empty} ${!query.trim() ? styles.emptyWithMate : ""}`}>{query.trim() ? <><strong>No matching answer keys</strong><p>Try a different search.</p></> : <><Image src="/images/mate/empty.png" width={96} height={96} alt="" aria-hidden="true" className={styles.emptyMate} /><div><strong>No saved answer keys yet</strong><p>Add an answer key to check a quiz made outside CheckMate.</p><Link href="/quizzes/existing">Add an answer key ↗</Link></div></>}</div>}</section>
    <section className={styles.listSection} aria-labelledby="created-quizzes-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>02 / MADE IN CHECKMATE</span><h2 id="created-quizzes-heading">Created quizzes <span className={styles.libraryCount}>{created.length}</span></h2><p>Quizzes you made in CheckMate, along with their answer keys.</p></div></div>{created.length ? listing(created) : <div className={`${styles.empty} ${!query.trim() && keys.length > 0 ? styles.emptyWithMate : ""}`}>{query.trim() ? <><strong>No matching created quizzes</strong><p>Try a different search.</p></> : <>{keys.length > 0 && <Image src="/images/mate/empty.png" width={96} height={96} alt="" aria-hidden="true" className={styles.emptyMate} />}<div><strong>No created quizzes yet</strong><p>Use the quiz maker if you want to create a new quiz in CheckMate.</p><Link href="/quizzes/new">Create a quiz ↗</Link></div></>}</div>}</section>
    <section className={`${styles.listSection} ${styles.archiveSection}`}><details><summary>Archived quizzes and keys ({archived.length})</summary><p>Open an archived quiz to view its papers or restore it.</p>{archived.length ? listing(archived) : <p>No archived quizzes match this search.</p>}</details></section>
  </>;
}
