"use client";

import { useState } from "react";
import { formatReportPeriod, reportDateRange } from "@/lib/admin-reports";
import { downloadCsv } from "./download-csv";
import styles from "./admin.module.css";

type Entry = { date: string; kind: "account" | "quiz" | "finalized" | "complete" | "failed" };
type Preset = "7" | "30" | "month" | "custom";
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
  const [preset, setPreset] = useState<Preset>("custom");
  const invalidRange = Boolean(from && to && from > to);
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
  function choosePreset(next: Exclude<Preset, "custom">) {
    const range = reportDateRange(next);
    setFrom(range.from); setTo(range.to); setPreset(next);
  }
  function reset() { setFrom(""); setTo(""); setInterval("month"); setPreset("custom"); }
  return <>
    <section className={styles.reportFilters} aria-labelledby="report-filter-heading">
      <div className={styles.reportFilterHeader}><div><h2 id="report-filter-heading">Date range</h2><p>Dates use Manila time. Leave blank to include all dates.</p></div><button type="button" onClick={reset}>Reset filters</button></div>
      <div className={styles.reportPresets} aria-label="Quick date ranges">
        {([["7", "Last 7 days"], ["30", "Last 30 days"], ["month", "This month"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={preset === value} onClick={() => choosePreset(value)}>{label}</button>)}
      </div>
      <div className={`${styles.filters} ${styles.reportFilterFields}`}>
        <label>From<input type="date" value={from} onChange={event => { setFrom(event.target.value); setPreset("custom"); }} /></label>
        <label>To<input type="date" value={to} onChange={event => { setTo(event.target.value); setPreset("custom"); }} /></label>
        <label>Group by<select value={interval} onChange={event => setInterval(event.target.value)}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
      </div>
      {invalidRange && <p role="alert" className={styles.error}>The start date must be on or before the end date.</p>}
    </section>
    {!invalidRange && <>
      <section className={styles.reportSection} aria-labelledby="report-summary-heading">
        <h2 id="report-summary-heading">Activity summary</h2><p>For the selected date range.</p>
        <div className={styles.reportCards}>{[["New accounts", totals[0]], ["Quizzes created", totals[1]], ["Papers finalized", totals[2]]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </section>
      <section className={styles.reportSection} aria-labelledby="report-page-heading">
        <h2 id="report-page-heading">Page status now</h2><p>Current status of pages uploaded in the selected date range; this is not a history of failures.</p>
        <div className={styles.reportCards}>{[["Currently complete", totals[3]], ["Currently failed", totals[4]]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </section>
      <section className={styles.reportSection} aria-labelledby="report-breakdown-heading">
        <div className={styles.queueToolbar}><div><h2 id="report-breakdown-heading">Breakdown</h2><p>Accounts and quizzes use creation date; papers use finalization date. Page statuses use upload date.</p></div><button type="button" disabled={!rows.length} onClick={() => downloadCsv("checkmate-report.csv", [["Period", "New accounts", "Quizzes created", "Papers finalized", "Currently complete pages by upload date", "Currently failed pages by upload date"], ...rows.map(([key, counts]) => [key, ...counts.map(String)]), ["Total", ...totals.map(String)]])}>Export CSV</button></div>
        {rows.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Period {interval === "week" && "(week starting)"}</th><th scope="col">New accounts</th><th scope="col">Quizzes created</th><th scope="col">Papers finalized</th><th scope="col">Currently complete</th><th scope="col">Currently failed</th></tr></thead><tbody>{rows.map(([key, counts]) => <tr key={key}><th scope="row">{formatReportPeriod(key, interval)}</th>{counts.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody></table></div> : <div className={styles.empty}><strong>No data in this range</strong><p>Try another date range.</p></div>}
      </section>
    </>}
  </>;
}
