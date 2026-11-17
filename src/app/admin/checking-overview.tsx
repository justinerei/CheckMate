"use client";

import Link from "next/link";
import { useAdminLiveData } from "./admin-live-data";
import styles from "./admin.module.css";
import live from "./admin-live.module.css";

const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default function CheckingOverview() {
  const { data, unavailable } = useAdminLiveData();
  const overview = data?.overview;
  const activity = overview?.activity ?? [];
  const step = Math.max(1, Math.ceil(Math.max(...activity.map(day => day.count), 0) / 4));
  const rows = [
    { name: "Waiting", status: "PENDING", count: overview?.waiting },
    { name: "Processing", status: "PROCESSING", count: overview?.processing },
    { name: "Needs retry", status: "FAILED", count: overview?.failed },
  ];

  return <div className={live.checkingGrid}>
    <section className={`${styles.overviewPanel} ${live.queuePanel}`} aria-labelledby="checking-queue-title">
      <h2 id="checking-queue-title" className={live.panelTitle}>Checking at a glance</h2>
      <p className={live.queueStatus}>
        <span className={overview?.processing && !unavailable ? live.pulse : live.idleDot} aria-hidden="true" />
        {unavailable ? "Live updates unavailable" : !overview ? "Loading queue…" :
          overview.processing ? `${overview.processing} ${overview.processing === 1 ? "page" : "pages"} processing` : "No pages processing"}
      </p>
      <div className={styles.overviewRows}>
        {rows.map(row => <Link key={row.status} className={styles.overviewRow} href={`/admin/queue?status=${row.status}`}>
          <span>{row.name}</span><strong>{row.count ?? "—"}</strong>
        </Link>)}
      </div>
      <Link className={live.queueLink} href="/admin/queue">Open checking queue <span aria-hidden="true">→</span></Link>
    </section>
    <section className={`${styles.overviewPanel} ${live.activityPanel}`} aria-labelledby="checking-activity">
      <h2 id="checking-activity" className={live.panelTitle}>Checking activity</h2>
      <p className={live.caption}>Papers finalized · Last 7 days</p>
      {overview ? <div className={live.chart} role="group" aria-label="Daily finalized papers, Manila time">
        <div className={live.axis} aria-hidden="true">{[4, 3, 2, 1, 0].map(tick => <span key={tick}>{tick * step}</span>)}</div>
        <ul className={live.bars}>
          {activity.map(day => {
            const date = new Date(day.date);
            const label = `${fullDate.format(date)}: ${day.count} finalized ${day.count === 1 ? "paper" : "papers"}`;
            return <li key={day.date} aria-label={label} title={label}>
              <span className={live.bar} style={{ height: `${day.count / (step * 4) * 100}%` }} />
              <span className={live.day} aria-hidden="true">{weekday.format(date)}</span>
            </li>;
          })}
        </ul>
      </div> : <p className={live.emptyChart}>{unavailable ? "Checking activity is unavailable." : "Loading checking activity…"}</p>}
    </section>
  </div>;
}
