"use client";
import { useState } from "react";
import Link from "next/link";
import { matchesSearch } from "@/lib/list-filter";
import { quizDestination } from "@/lib/workspace-navigation";
import styles from "../workspace-content.module.css";

type Quiz = { id: string; title: string; source: string; updated: string; papers: number };
export default function QuizLibrary({ quizzes }: { quizzes: Quiz[] }) {
  const [query, setQuery] = useState("");
  const visible = quizzes.filter(quiz => matchesSearch([quiz.title], query));
  const keys = visible.filter(quiz => quiz.source === "EXISTING");
  const created = visible.filter(quiz => quiz.source !== "EXISTING");
  function listing(items: Quiz[], kind: "key" | "quiz") {
    return <div className={styles.quizGrid}>{items.map(item => <Link className={styles.quizCard} href={quizDestination(item.id, item.source)} key={item.id}>
      <span className={styles.cardTop}><span className={styles.rowIcon} aria-hidden="true">{kind === "key" ? "▤" : "▦"}</span><span aria-hidden="true">↗</span></span>
      <strong>{item.title}</strong><span className={styles.cardMeta}>{kind === "key" ? "Existing quiz" : "Created quiz"} · {item.papers} {item.papers === 1 ? "paper" : "papers"}</span><span className={styles.cardFooter}>Updated {item.updated} <span>Open quiz →</span></span>
    </Link>)}</div>;
  }
  return <><div className={styles.librarySearch}><label htmlFor="quiz-search">Search quizzes and keys</label><input id="quiz-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title" maxLength={120} /><p role="status">{visible.length} of {quizzes.length} {quizzes.length === 1 ? "quiz or key" : "quizzes and keys"} shown</p></div>
    <section className={styles.listSection} aria-labelledby="answer-keys-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>01 / FOR EXISTING QUIZZES</span><h2 id="answer-keys-heading">Answer keys <span className={styles.libraryCount}>{keys.length}</span></h2><p>Keys you uploaded or entered for quizzes made elsewhere. Open one to view its answers and student papers.</p></div></div>{keys.length ? listing(keys, "key") : <div className={styles.empty}>{query.trim() ? <><strong>No matching answer keys</strong><p>Try a different search.</p></> : <><strong>No saved answer keys yet</strong><p>Add an answer key to check a quiz made outside CheckMate.</p><Link href="/quizzes/existing">Add an answer key ↗</Link></>}</div>}</section>
    <section className={styles.listSection} aria-labelledby="created-quizzes-heading"><div className={styles.headingRow}><div><span className={styles.sectionIndex}>02 / MADE IN CHECKMATE</span><h2 id="created-quizzes-heading">Created quizzes <span className={styles.libraryCount}>{created.length}</span></h2><p>Quizzes you made in CheckMate, along with their answer keys.</p></div></div>{created.length ? listing(created, "quiz") : <div className={styles.empty}>{query.trim() ? <><strong>No matching created quizzes</strong><p>Try a different search.</p></> : <><strong>No created quizzes yet</strong><p>Use the quiz maker if you want to create a new quiz in CheckMate.</p><Link href="/quizzes/new">Create a quiz ↗</Link></>}</div>}</section>
  </>;
}
