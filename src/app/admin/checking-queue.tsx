"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryPages } from "./actions";
import styles from "./admin.module.css";

type Page = { id: string; pageNumber: number; status: string; error: string | null; retryAt: string | null; createdAt: string; quiz: string; teacher: string; batch: boolean; inReview: boolean };
const format = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export default function CheckingQueue({ pages, initialStatus }: { pages: Page[]; initialStatus?: string }) {
  const [status, setStatus] = useState(["PENDING", "PROCESSING", "COMPLETE", "FAILED"].includes(initialStatus ?? "") ? initialStatus! : "ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const visible = pages.filter(page => status === "ALL" || page.status === status);
  const eligible = (page: Page) => page.status === "FAILED" && !page.retryAt && page.batch && page.inReview;
  async function retry(ids: string[]) {
    setBusy(true);
    setMessage("");
    try {
      const result = await retryPages(ids);
      setMessage(result.error || `${result.count} page(s) queued for retry.`);
      setSelected([]);
      router.refresh();
    } catch { setMessage("Could not queue pages. Try again."); }
    finally { setBusy(false); }
  }
  return <>
    <div className={styles.queueToolbar}>
      <label>Page status <select value={status} onChange={event => setStatus(event.target.value)}><option value="ALL">All statuses</option>{["PENDING", "PROCESSING", "COMPLETE", "FAILED"].map(value => <option key={value} value={value}>{value.toLowerCase()}</option>)}</select></label>
      <button type="button" disabled={!selected.length || busy} onClick={() => void retry(selected)}>Retry selected ({selected.length})</button>
    </div>
    <p className={styles.count} role="status">{message || `${visible.length} pages shown. Automatic retries keep their scheduled time.`}</p>
    {visible.length ? <ul className={styles.activity}>{visible.map(page => <li key={page.id}>
      <div className={styles.queueItem}>
        <div><strong>{page.quiz} · Page {page.pageNumber}</strong><p>{page.teacher} · {page.status.toLowerCase()} · Added {format(page.createdAt)}</p>
          {page.error && <p>{page.error}</p>}
          {page.retryAt && <small>Automatic retry after {format(page.retryAt)}</small>}
          {!page.batch && <small>Individual paper · retry from the teacher workspace</small>}
          {page.batch && !page.inReview && <small>Paper is no longer in review</small>}
        </div>
        {eligible(page) && <div className={styles.queueActions}><label><input type="checkbox" checked={selected.includes(page.id)} onChange={event => setSelected(current => event.target.checked ? [...current, page.id].slice(0, 100) : current.filter(id => id !== page.id))} /> Select</label><button type="button" disabled={busy} onClick={() => void retry([page.id])}>Retry page</button></div>}
      </div>
    </li>)}</ul> : <div className={styles.empty}><strong>No pages found</strong><p>Pages will appear here when teachers upload papers.</p></div>}
  </>;
}
