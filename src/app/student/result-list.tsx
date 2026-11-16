"use client";
import { useState } from "react";
import Mascot from "@/app/mascot";
import LibraryIcon from "@/app/library-icon";
import styles from "./student-workspace.module.css";

export type StudentResult = { id: string; title: string; score: string; maximum: number; releasedAt: string };
export default function ResultList({ results, searchable = false }: { results: StudentResult[]; searchable?: boolean }) {
  const [query, setQuery] = useState("");
  const visible = results.filter(result => result.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  return <>{searchable && results.length > 0 && <div className={styles.search}><label htmlFor="result-search">Search results</label><input id="result-search" type="search" maxLength={120} placeholder="Search by quiz title" value={query} onChange={event => setQuery(event.target.value)} /><p role="status">{visible.length} of {results.length} results shown</p></div>}{visible.length ? <ul className={styles.results}>{visible.map(result => <li key={result.id}><span className={styles.rowIcon}><LibraryIcon type="paper" /></span><div className={styles.resultInfo}><strong>{result.title}</strong><small>{result.releasedAt ? `Released ${date.format(new Date(result.releasedAt))}` : "Released"}</small></div><span className={styles.score}>{result.score} <small>/ {result.maximum}</small></span></li>)}</ul> : <div className={styles.empty}>{!query.trim() && <Mascot state="empty" width={96} height={96} className={styles.emptyMate} />}<div><strong>{query.trim() ? "No matching results" : "No released results yet"}</strong><p>{query.trim() ? "Try another quiz title." : "Your teacher will let you know when scores are ready."}</p></div></div>}</>;
}
