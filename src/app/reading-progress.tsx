import { readingProgress } from "@/lib/reading-progress";
import styles from "./reading-progress.module.css";

type Paper = Parameters<typeof readingProgress>[0][number];

export default function ReadingProgress({ papers, label }: { papers: Paper[]; label: string }) {
  const { total, completed, state } = readingProgress(papers);
  if (!total) return null;
  const percent = Math.round(completed / total * 100);
  return <section className={styles.panel} aria-label={label}>
    <div className={styles.head}><div><span className={styles.label}>{label}</span><strong className={styles.state}><span aria-hidden="true" className={styles.dot} />{state}</strong></div><span className={styles.count}>{completed} / {total} pages read</span></div>
    <progress className={styles.bar} value={completed} max={total} aria-label={`${label}: ${completed} of ${total} pages read`} aria-valuetext={`${completed} of ${total} pages read; ${state}`} />
    <p className={styles.note}>{percent}% of pages read · Review and finalization are separate</p>
  </section>;
}
