"use client";
import { useState } from "react";
import Link from "next/link";
import Mascot from "@/app/mascot";
import LibraryIcon from "@/app/library-icon";
import { matchesSearch } from "@/lib/list-filter";
import { quizDestination } from "@/lib/workspace-navigation";
import QuizCardActions from "./quiz-card-actions";
import styles from "../workspace-content.module.css";

type Quiz = { id: string; title: string; source: string; archived: boolean; updated: string; papers: number; questions: number; missingAnswers: number };

export default function QuizLibrary({ quizzes }: { quizzes: Quiz[] }) {
  const [query, setQuery] = useState("");
  const visible = quizzes.filter(quiz => matchesSearch([quiz.title], query));
  const active = visible.filter(quiz => !quiz.archived);
  const archived = visible.filter(quiz => quiz.archived);
  const keys = active;
  const created = active.filter(quiz => quiz.source !== "EXISTING");
  function listing(items: Quiz[], keys = false) {
    return <ul className={styles.catalogList}>{items.map(item => {
      const type = keys || item.source === "EXISTING" ? "key" : "quiz";
      const destination = keys ? `/quizzes/${encodeURIComponent(item.id)}/overview?view=key#answer-key` : quizDestination(item.id, item.source);
      return <li className={`${styles.catalogItem} ${!keys ? styles.catalogWithMenu : ""}`} key={item.id}>
        <Link className={styles.catalogLink} href={destination}>
          <span className={`${styles.catalogIcon} ${type === "key" ? styles.catalogKey : styles.catalogQuiz}`}><LibraryIcon type={type} /></span>
          <span className={styles.catalogTitle}><strong>{item.title}</strong><small>{keys ? item.source === "EXISTING" ? "Added manually" : "Created in CheckMate" : item.source === "EXISTING" ? "Existing quiz" : "Created quiz"}</small></span>
          <span className={styles.catalogDetail}>{keys ? `${item.questions} ${item.questions === 1 ? "question" : "questions"}` : `${item.papers} ${item.papers === 1 ? "paper" : "papers"}`}</span>
          <span className={styles.catalogState}>{keys && item.missingAnswers > 0 ? <span className={styles.missingBadge}>{item.missingAnswers} {item.missingAnswers === 1 ? "answer" : "answers"} missing</span> : keys && item.questions === 0 ? "No questions yet" : null}</span>
          <span className={styles.catalogDate}>Updated {item.updated}</span>
          <span className={styles.catalogAction}>{keys ? "View key" : "Open quiz"} <span aria-hidden="true">→</span></span>
        </Link>{!keys && <QuizCardActions quiz={item} />}
      </li>;
    })}</ul>;
  }
  return <><div className={styles.librarySearch}><label htmlFor="quiz-search">Search quizzes and keys</label><input id="quiz-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title" maxLength={120} /><p role="status">{visible.length} of {quizzes.length} {quizzes.length === 1 ? "quiz or key" : "quizzes and keys"} shown</p></div>
    <section className={styles.listSection} aria-labelledby="answer-keys-heading"><div className={styles.headingRow}><div><h2 id="answer-keys-heading">Answer keys <span className={styles.libraryCount}>{keys.length}</span></h2><p>Answer keys for your created quizzes and quizzes made outside CheckMate.</p></div></div>{keys.length ? listing(keys, true) : <div className={`${styles.empty} ${!query.trim() ? styles.emptyWithMate : ""}`}>{query.trim() ? <><strong>No matching answer keys</strong><p>Try a different search.</p></> : <><Mascot state="empty" width={96} height={96} className={styles.emptyMate} /><div><strong>No answer keys yet</strong><p>Create a quiz or add an answer key for a quiz made outside CheckMate.</p><Link href="/quizzes/existing">Add an answer key ↗</Link></div></>}</div>}</section>
    <section className={styles.listSection} aria-labelledby="created-quizzes-heading"><div className={styles.headingRow}><div><h2 id="created-quizzes-heading">Created quizzes <span className={styles.libraryCount}>{created.length}</span></h2><p>Correct answers are saved inside each quiz as you add them. Open a quiz to view its answer key.</p></div></div>{created.length ? listing(created) : <div className={`${styles.empty} ${!query.trim() && keys.length > 0 ? styles.emptyWithMate : ""}`}>{query.trim() ? <><strong>No matching created quizzes</strong><p>Try a different search.</p></> : <>{keys.length > 0 && <Mascot state="empty" width={96} height={96} className={styles.emptyMate} />}<div><strong>No created quizzes yet</strong><p>Build your first quiz in CheckMate.</p><Link href="/quizzes/new">Create a quiz ↗</Link></div></>}</div>}</section>
    <section className={`${styles.listSection} ${styles.archiveSection}`}><details data-accordion><summary>Archived quizzes and keys ({archived.length})</summary><p>Open an archived quiz to view its papers or restore it.</p>{archived.length ? listing(archived) : <p>No archived quizzes match this search.</p>}</details></section>
  </>;
}
