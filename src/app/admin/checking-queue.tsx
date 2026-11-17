"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryPages } from "./actions";
import styles from "./admin.module.css";
import { canRetryPage, eligibleVisiblePageIds, initialQueueStatus, matchesQueueStatus } from "@/lib/admin-queue";

type Page = { id: string; pageNumber: number; status: string; error: string | null; retryAt: string | null; createdAt: string; quiz: string; teacher: string; batch: boolean; inReview: boolean };
const format = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export default function CheckingQueue({ pages, initialStatus }: { pages: Page[]; initialStatus?: string }) {
  const [status, setStatus] = useState(() => initialQueueStatus(initialStatus));
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const visible = pages.filter(page => matchesQueueStatus(page, status));
  const eligibleIds = eligibleVisiblePageIds(pages, status);
  const visibleSelection = selected.filter(id => visible.some(page => page.id === id && canRetryPage(page)));
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
      <label>Page status <select value={status} onChange={event => { setStatus(event.target.value); setSelected([]); setMessage(""); }}><option value="NEEDS_ATTENTION">Needs attention</option><option value="PENDING">Waiting</option><option value="PROCESSING">Processing</option><option value="COMPLETE">Completed</option><option value="FAILED">Failed</option><option value="ALL">All statuses</option></select></label>
      {eligibleIds.length > 0 && <div className={styles.queueActions}><button type="button" disabled={busy} onClick={() => setSelected(eligibleIds)}>Select eligible pages (up to 100)</button><button type="button" disabled={!visibleSelection.length || busy} onClick={() => void retry(visibleSelection)}>Retry selected ({visibleSelection.length})</button></div>}
    </div>
    <p className={styles.count} role="status">{message || `${visible.length} pages shown. Automatic retries keep their scheduled time.`}</p>
    {visible.length ? <ul className={styles.activity}>{visible.map(page => <li key={page.id}>
      <div className={styles.queueItem}>
        <div><strong>{page.quiz} · Page {page.pageNumber}</strong><p>{page.teacher} · {page.status.toLowerCase()} · Added {format(page.createdAt)}</p>
          {page.error && <p>{page.error}</p>}
          {page.retryAt && <small>Automatic retry after {format(page.retryAt)}</small>}
          {page.status === "FAILED" && !page.batch && <small>Individual paper · retry from the teacher workspace</small>}
          {page.status === "FAILED" && page.batch && !page.inReview && <small>Paper is no longer in review</small>}
        </div>
        {canRetryPage(page) && <div className={styles.queueActions}><label><input type="checkbox" checked={selected.includes(page.id)} onChange={event => setSelected(current => event.target.checked ? [...current, page.id].slice(0, 100) : current.filter(id => id !== page.id))} /> Select</label><button type="button" disabled={busy} onClick={() => void retry([page.id])}>Retry page</button></div>}
      </div>
    </li>)}</ul> : <div className={styles.empty}><strong>{status === "NEEDS_ATTENTION" ? "No pages need attention" : "No pages found"}</strong><p>{status === "NEEDS_ATTENTION" ? "Failed pages will appear here. Use the status filter to see other pages." : "Try another status to see other pages."}</p></div>}
  </>;
}
