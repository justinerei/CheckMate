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
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="3" width="15" height="18" rx="2" />
    {type === "key" ? <><path d="m7.5 8 1.1 1.1L10.5 7M12.5 8h3.5M7.5 14l1.1 1.1 1.9-2.1M12.5 14h3.5" /></> : <><path d="M8 8h8M8 12h5M8 16h3" /><circle cx="16.5" cy="16" r="1.5" /></>}
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
