"use client";
import { useState } from "react";
import Link from "next/link";
import Mascot from "@/app/mascot";
import { matchesSearch } from "@/lib/list-filter";
import { quizDestination } from "@/lib/workspace-navigation";
import QuizCardActions from "./quiz-card-actions";
import styles from "../workspace-content.module.css";

type Quiz = { id: string; title: string; source: string; archived: boolean; updated: string; papers: number; questions: number; missingAnswers: number };

function LibraryIcon({ type }: { type: "quiz" | "key" }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" shapeRendering="crispEdges">
    <path d="M4 2h11v2h2v2h2v16H4z" fill="#f9e8d6" stroke="#100e0e" strokeWidth="2" strokeLinejoin="miter" />
    <path d="M15 2v5h4" stroke="#100e0e" strokeWidth="2" />
    {type === "key" ? <><path d="M6 13h3v2h2v2h2v-2h2v-2h2v-2h2v3h-2v2h-2v2h-2v2h-2v-1H9v-2H7v-2H6z" fill="#ff7000" /><path d="M7 8h5v2H7z" fill="#191414" /></> : <><path d="M8 8h2V7h5v2h2v3h-2v2h-2v2h-3v-3h2v-2h2V9h-4v1H8zM10 18h3v2h-3z" fill="#191414" /><path d="M7 8h2v2H7z" fill="#ff7000" /></>}
  </svg>;
}
export default function QuizLibrary({ quizzes }: { quizzes: Quiz[] }) {
  const [query, setQuery] = useState("");
  const visible = quizzes.filter(quiz => matchesSearch([quiz.title], query));
  const active = visible.filter(quiz => !quiz.archived);
  const archived = visible.filter(quiz => quiz.archived);
  const keys = active;
  const created = active.filter(quiz => quiz.source !== "EXISTING");
  function listing(items: Quiz[]) {
    return <div className={styles.quizGrid}>{items.map(item => <div className={styles.quizCardWrap} key={item.id}><Link className={styles.quizCard} href={quizDestination(item.id, item.source)}>
      <span className={styles.cardTop}><span className={styles.rowIcon}><LibraryIcon type={item.source === "EXISTING" ? "key" : "quiz"} /></span></span>
      <strong>{item.title}</strong><span className={styles.cardMeta}>{item.source === "EXISTING" ? "Existing quiz" : "Created quiz"} · {item.papers} {item.papers === 1 ? "paper" : "papers"}</span><span className={styles.cardFooter}>Updated {item.updated} <span>Open quiz →</span></span>
    </Link><QuizCardActions quiz={item} /></div>)}</div>;
  }
  function keyListing(items: Quiz[]) {
    return <div className={styles.quizGrid}>{items.map(item => <Link className={styles.quizCard} href={`/quizzes/${encodeURIComponent(item.id)}/overview?view=key#answer-key`} key={item.id}>
      <span className={styles.cardTop}><span className={styles.rowIcon}><LibraryIcon type="key" /></span><span aria-hidden="true">↗</span></span>
      <strong>{item.title}</strong><span className={styles.cardMeta}>{item.source === "EXISTING" ? "Added manually" : "Created in CheckMate"} · {item.questions === 0 ? "No questions yet" : item.missingAnswers ? `${item.missingAnswers} ${item.missingAnswers === 1 ? "answer" : "answers"} missing` : `${item.questions} ${item.questions === 1 ? "question" : "questions"}`}</span><span className={styles.cardFooter}>Updated {item.updated} <span>View key →</span></span>
    </Link>)}</div>;
  }
  return <><div className={styles.librarySearch}><label htmlFor="quiz-search">Search quizzes and keys</label><input id="quiz-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title" maxLength={120} /><p role="status">{visible.length} of {quizzes.length} {quizzes.length === 1 ? "quiz or key" : "quizzes and keys"} shown</p></div>
    <section className={styles.listSection} aria-labelledby="answer-keys-heading"><div className={styles.headingRow}><div><h2 id="answer-keys-heading">Answer keys <span className={styles.libraryCount}>{keys.length}</span></h2><p>Answer keys for your created quizzes and quizzes made outside CheckMate.</p></div></div>{keys.length ? keyListing(keys) : <div className={`${styles.empty} ${!query.trim() ? styles.emptyWithMate : ""}`}>{query.trim() ? <><strong>No matching answer keys</strong><p>Try a different search.</p></> : <><Mascot state="empty" width={96} height={96} className={styles.emptyMate} /><div><strong>No answer keys yet</strong><p>Create a quiz or add an answer key for a quiz made outside CheckMate.</p><Link href="/quizzes/existing">Add an answer key ↗</Link></div></>}</div>}</section>
    <section className={styles.listSection} aria-labelledby="created-quizzes-heading"><div className={styles.headingRow}><div><h2 id="created-quizzes-heading">Created quizzes <span className={styles.libraryCount}>{created.length}</span></h2><p>Correct answers are saved inside each quiz as you add them. Open a quiz to view its answer key.</p></div></div>{created.length ? listing(created) : <div className={`${styles.empty} ${!query.trim() && keys.length > 0 ? styles.emptyWithMate : ""}`}>{query.trim() ? <><strong>No matching created quizzes</strong><p>Try a different search.</p></> : <>{keys.length > 0 && <Mascot state="empty" width={96} height={96} className={styles.emptyMate} />}<div><strong>No created quizzes yet</strong><p>Build your first quiz in CheckMate.</p><Link href="/quizzes/new">Create a quiz ↗</Link></div></>}</div>}</section>
    <section className={`${styles.listSection} ${styles.archiveSection}`}><details><summary>Archived quizzes and keys ({archived.length})</summary><p>Open an archived quiz to view its papers or restore it.</p>{archived.length ? listing(archived) : <p>No archived quizzes match this search.</p>}</details></section>
  </>;
}
