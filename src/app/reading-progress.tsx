import type { ReactNode } from "react";
import { readingProgress } from "@/lib/reading-progress";
import Mascot from "@/app/mascot";
import styles from "./reading-progress.module.css";

type Paper = Parameters<typeof readingProgress>[0][number];

export default function ReadingProgress({ papers, label, showMascot = false, notice }: { papers: Paper[]; label: string; showMascot?: boolean; notice?: { title: string; description: ReactNode; mascot: "ready" | "thinking" | "concerned" } }) {
  const { total, completed, state } = readingProgress(papers);
  if (!total && !notice) return null;
  const percent = total ? Math.round(completed / total * 100) : 0;
  if (notice) return <section className={`${styles.panel} ${styles.combined}`} aria-label={label}>
    <div className={styles.combinedHead} role="status"><Mascot state={notice.mascot} width={64} height={64} className={styles.mascot} /><div className={styles.notice}><strong>{notice.title}</strong><p>{notice.description}</p></div>{total > 0 && <div className={styles.combinedCount}><strong>{completed} <span>/ {total}</span></strong><span>pages read</span></div>}</div>
    {total > 0 && <><progress className={styles.bar} value={completed} max={total} aria-label={`${label}: ${completed} of ${total} pages read`} aria-valuetext={`${completed} of ${total} pages read; ${state}`} /><p className={styles.note}>{percent}% of pages read · Review and finalization are separate</p></>}
  </section>;
  return <section className={styles.panel} aria-label={label}>
    {showMascot && <Mascot state={state === "Pages read" ? "celebrate" : state === "Needs attention" ? "concerned" : "ready"} width={64} height={64} className={styles.mascot} />}
    <div className={styles.content}>
    <div className={styles.head}><div><span className={styles.label}>{label}</span><strong className={styles.state}><span aria-hidden="true" className={styles.dot} />{state}</strong></div><span className={styles.count}>{completed} / {total} pages read</span></div>
    <progress className={styles.bar} value={completed} max={total} aria-label={`${label}: ${completed} of ${total} pages read`} aria-valuetext={`${completed} of ${total} pages read; ${state}`} />
    <p className={styles.note}>{percent}% of pages read · Review and finalization are separate</p>
    </div>
  </section>;
}
