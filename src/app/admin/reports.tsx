"use client";

import { useState } from "react";
import { downloadCsv } from "./download-csv";
import styles from "./admin.module.css";

type Entry = { date: string; kind: "account" | "quiz" | "finalized" | "complete" | "failed" };
const day = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
function period(date: string, interval: string) {
  if (interval === "month") return date.slice(0, 7);
  if (interval === "week") {
    const start = new Date(`${date}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return start.toISOString().slice(0, 10);
  }
  return date;
}

export default function Reports({ entries }: { entries: Entry[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [interval, setInterval] = useState("month");
  const groups = new Map<string, number[]>();
  for (const entry of entries) {
    const date = day(entry.date);
    if ((from && date < from) || (to && date > to)) continue;
    const key = period(date, interval);
    const counts = groups.get(key) ?? [0, 0, 0, 0, 0];
    counts[["account", "quiz", "finalized", "complete", "failed"].indexOf(entry.kind)]++;
    groups.set(key, counts);
  }
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const totals = rows.reduce((sum, [, counts]) => sum.map((value, index) => value + counts[index]), [0, 0, 0, 0, 0]);
  return <>
    <div className={styles.filters}>
      <label>From<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label>To<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      <label>Group by<select value={interval} onChange={event => setInterval(event.target.value)}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
    </div>
    <p className={styles.count}>Dates use Manila time. Page counts reflect their current status, grouped by upload date. Finalized papers use finalization date.</p>
    <div className={styles.queueToolbar}><strong>{totals[0]} accounts · {totals[1]} quizzes · {totals[2]} finalized · {totals[3]} complete pages · {totals[4]} failed pages</strong><button type="button" disabled={!rows.length} onClick={() => downloadCsv("checkmate-report.csv", [["Period", "Accounts", "Quizzes", "Finalized papers", "Complete pages", "Failed pages"], ...rows.map(([key, counts]) => [key, ...counts.map(String)]), ["Total", ...totals.map(String)]])}>Export CSV</button></div>
    {rows.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Period {interval === "week" && "(week starting)"}</th><th>Accounts</th><th>Quizzes</th><th>Finalized</th><th>Complete pages</th><th>Failed pages</th></tr></thead><tbody>{rows.map(([key, counts]) => <tr key={key}><td>{key}</td>{counts.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody></table></div> : <div className={styles.empty}><strong>No data in this range</strong></div>}
  </>;
}
