"use client";
import { useState } from "react";
import Link from "next/link";
import LibraryIcon from "@/app/library-icon";
import { matchesPaperFilter, matchesSearch, type PaperFilter } from "@/lib/list-filter";
import styles from "./quiz-overview.module.css";

type Paper = { id: string; name: string; linkedName: string | null; status: string; statusLabel: string; updated: string; score: string; href: string };
export default function PaperList({ papers }: { papers: Paper[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PaperFilter>("all");
  const visible = papers.filter(paper => matchesPaperFilter(paper.status, filter) && matchesSearch([paper.name, paper.linkedName], query));
  return <><div className={styles.paperFilters}><label>Search papers<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Student or paper name" maxLength={120} /></label><label>Status<select value={filter} onChange={event => setFilter(event.target.value as PaperFilter)}><option value="all">All papers</option><option value="progress">In progress</option><option value="finalized">Finalized</option></select></label><p role="status">{visible.length} of {papers.length} {papers.length === 1 ? "paper" : "papers"} shown</p></div>
    {visible.length ? <div className={styles.paperList}>{visible.map(paper => <Link className={styles.paper} href={paper.href} key={paper.id}><span className={styles.paperIcon}><LibraryIcon type="paper" paperState={paper.status === "FINALIZED" ? "finalized" : paper.statusLabel === "Page needs attention" || paper.statusLabel === "Photos needed" ? "attention" : "review"} /></span><span className={styles.paperName}><strong>{paper.name}</strong>{paper.linkedName && paper.linkedName !== paper.name && <small>Linked student: {paper.linkedName}</small>}<small>Updated {paper.updated}</small></span><span className={styles.status}>{paper.statusLabel}</span><span className={styles.score}>{paper.score}</span><span className={styles.arrow} aria-hidden="true">→</span></Link>)}</div> : <div className={styles.empty}><strong>No matching papers</strong><p>Try another name or status.</p></div>}
  </>;
}
