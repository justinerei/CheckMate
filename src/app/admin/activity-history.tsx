"use client";

import { useState } from "react";
import { downloadCsv } from "./download-csv";
import styles from "./admin.module.css";

type Event = { id: string; action: string; reason: string | null; createdAt: string; actor: { name: string; email: string }; target: { name: string; email: string } };
const labels: Record<string, string> = { ACCOUNT_ENABLED: "Access enabled", ACCOUNT_DISABLED: "Access disabled", ACCOUNT_UNLOCKED: "Account unlocked", PAGE_RETRY: "Page queued for retry" };
const dateKey = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const displayDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export default function ActivityHistory({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const term = query.trim().toLowerCase();
  const filtered = events.filter(event => (!term || `${event.actor.name} ${event.actor.email} ${event.target.name} ${event.target.email}`.toLowerCase().includes(term)) && (action === "ALL" || event.action === action) && (!from || dateKey(event.createdAt) >= from) && (!to || dateKey(event.createdAt) <= to));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 25, currentPage * 25);
  function exportEvents() {
    downloadCsv("checkmate-admin-activity.csv", [["Date (Asia/Manila)", "Action", "Admin", "Admin email", "Account", "Account email", "Details"], ...filtered.map(event => [displayDate(event.createdAt), labels[event.action] ?? event.action, event.actor.name, event.actor.email, event.target.name, event.target.email, event.reason ?? ""])]);
  }
  return <>
    <div className={styles.filters}>
      <label>Search accounts<input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Name or email" /></label>
      <label>Action<select value={action} onChange={event => { setAction(event.target.value); setPage(1); }}><option value="ALL">All actions</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>From<input type="date" value={from} onChange={event => { setFrom(event.target.value); setPage(1); }} /></label>
      <label>To<input type="date" value={to} onChange={event => { setTo(event.target.value); setPage(1); }} /></label>
    </div>
    <div className={styles.queueToolbar}><p className={styles.count}>{filtered.length} events · Page {currentPage} of {totalPages}</p><button type="button" onClick={exportEvents} disabled={!filtered.length}>Export CSV</button></div>
    {visible.length ? <ul className={styles.activity}>{visible.map(event => <li key={event.id}><span className={styles.activityIcon} aria-hidden="true">↗</span><div><strong>{labels[event.action] ?? event.action}</strong><p>{event.target.name} · {event.target.email}</p>{event.reason && <p>{event.reason}</p>}<small>By {event.actor.name} ({event.actor.email}) · {displayDate(event.createdAt)}</small></div></li>)}</ul> : <div className={styles.empty}><strong>No matching activity</strong></div>}
    <div className={styles.queueToolbar}><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
  </>;
}
