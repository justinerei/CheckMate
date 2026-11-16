"use client";
import { PendingScreen } from "@/app/pending-screen";
import Mascot from "@/app/mascot";
import ReadingProgress from "@/app/reading-progress";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MAX_PHOTO_BYTES, pagesComplete } from "@/lib/submission-upload";
import { isMobileCaptureDevice } from "@/lib/mobile-capture";
import { paperReviewUrl, type PaperOrigin } from "@/lib/back-navigation";
import { shortRetrySeconds } from "@/lib/short-retry";
import { confirmAndAddBatchPaper, confirmSubmission, reopenSubmission, updateExpectedPages, swapPages, retryBatchPage } from "../actions";
import { canAddPaper, MAX_BATCH_PAPERS } from "@/lib/batch-policy";
import FileDropzone from "../file-dropzone";
import PhotoPreview from "../photo-preview";
import ConfirmDialog from "../confirm-dialog";
import GuidedCamera from "./guided-camera";
import styles from "../submissions.module.css";
import { RetryTime } from "@/app/retry-time";

const subscribeDevice = () => () => {};
function mobileDevice() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return isMobileCaptureDevice(nav.userAgent, nav.platform, nav.maxTouchPoints, nav.userAgentData?.mobile);
}
const serverDevice = () => false;

type Page = { id: string; pageNumber: number; status: string; error: string | null; retryAt: string | null };

function PageSlot({ submissionId, batchId, number, page, editable, canExtract, disabled, onEarlier, onLater }: { batchId: string | null; submissionId: string; number: number; page?: Page; editable: boolean; canExtract: boolean; disabled: boolean; onEarlier?: () => void; onLater?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  async function remove() {
    if (!page) return;
    setConfirmRemove(false);
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/submissions/${submissionId}/pages/${page.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Could not remove this photo."); return; }
      setMessage("Photo removed. You can upload a replacement."); router.refresh();
    } catch { setMessage("Could not remove this photo. Please retry."); }
    finally { setBusy(false); }
  }
  async function extract() {
    if (!page) return;
    setBusy(true); setMessage("");
    try {
      if (batchId) { const result = await retryBatchPage(submissionId, page.id); if (result.error) setMessage(result.error); router.refresh(); return; }
      const response = await fetch(`/api/submissions/${submissionId}/pages/${page.id}/extract`, { method: "POST" });
      const result = await response.json();
      setMessage(response.ok ? "Answers extracted. Review them against the photo." : result.error ?? "Could not process this page.");
      router.refresh();
    } catch { setMessage("Connection lost. Refresh to check the page status before retrying."); }
    finally { setBusy(false); }
  }
  return <section className={styles.pageCard}><PendingScreen pending={busy} message="Processing the photo…" /><div className={styles.pageTop}><h3>Page {number}</h3><span>{page ? "UPLOADED" : "MISSING"}</span></div>
    {page ? <><PhotoPreview className={styles.photo} src={`/api/submissions/${submissionId}/pages/${page.id}`} alt={`Page ${number} photo`} onLoad={() => setImageError(false)} onError={() => setImageError(true)} />{imageError && <p className={styles.error} role="alert">This photo could not be loaded. {editable ? "Remove it and upload it again." : "Contact the app administrator."}</p>}{editable && <div className={styles.pageToolbar}>
      <div className={styles.pageOrderControls} role="group" aria-label={`Reorder page ${number}`}>
        <button type="button" onClick={onEarlier} disabled={busy || disabled || !onEarlier} aria-label={onEarlier ? `Move page ${number} to page ${number - 1}` : "Move to previous page"}><span aria-hidden="true">←</span> {onEarlier ? `Move to page ${number - 1}` : "Move to previous page"}</button>
        <button type="button" onClick={onLater} disabled={busy || disabled || !onLater} aria-label={onLater ? `Move page ${number} to page ${number + 1}` : "Move to next page"}>{onLater ? `Move to page ${number + 1}` : "Move to next page"} <span aria-hidden="true">→</span></button>
      </div>
      <button type="button" className={styles.removePageButton} onClick={() => setConfirmRemove(true)} disabled={busy || disabled}>{busy ? "Removing…" : "Remove"}</button>
    </div>}</> : <div className={styles.pagePlaceholder}><span aria-hidden="true">+</span><p>Waiting for page {number}</p></div>}
    {page && !editable && <div className={styles.extract}><p>{page.status === "FAILED" && page.retryAt ? "Waiting to retry" : page.status === "FAILED" ? "Page needs attention" : page.status === "PENDING" ? "Queued for checking" : page.status === "PROCESSING" ? "Reading page" : page.status === "COMPLETE" ? "Page read" : `Status: ${page.status.toLowerCase()}`}</p>{page.status === "FAILED" && page.retryAt && <p>{batchId ? "The background checker will retry automatically" : "You can retry"} after <RetryTime value={page.retryAt} />.</p>}{page.status === "FAILED" && page.error && <p className={styles.error}>{page.error}</p>}{canExtract && (batchId ? page.status === "FAILED" && !page.retryAt : page.status !== "COMPLETE") && <button type="button" className={styles.secondary} disabled={busy} onClick={extract}>{busy ? "Reading photo…" : page.status === "PROCESSING" ? "Retry if stuck" : page.status === "FAILED" ? "Retry extraction" : "Extract answers"}</button>}</div>}
    {confirmRemove && <ConfirmDialog destructive title={`Remove page ${number}?`} message="This photo will be removed. You can upload a replacement before checking." confirmLabel="Remove photo" onCancel={() => setConfirmRemove(false)} onConfirm={remove} />}
    {message && <p className={message === "Photo saved." || message.startsWith("Photo removed.") || message.startsWith("Answers extracted.") ? styles.success : styles.error} role="status">{message}</p>}
  </section>;
}

export default function PhotoPages({ id, batchId, batchPaperCount, expectedPages, status, pages, existing, reviewOrigin, autoCamera = false }: { id: string; batchId: string | null; batchPaperCount: number; expectedPages: number; status: string; pages: Page[]; existing: boolean; reviewOrigin: PaperOrigin | null; autoCamera?: boolean }) {
  const router = useRouter();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [pending, startTransition] = useTransition();
  const [nextPages, setNextPages] = useState(expectedPages);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const mobile = useSyncExternalStore(subscribeDevice, mobileDevice, serverDevice);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [autoRequested, setAutoRequested] = useState(autoCamera && status === "DRAFT" && pages.length === 0);
  useEffect(() => { if (autoCamera) { const url = new URL(window.location.href); url.searchParams.delete("camera"); window.history.replaceState(window.history.state, "", url); } }, [autoCamera]);
  const [batchProgress, setBatchProgress] = useState("");
  const editable = status === "DRAFT";
  const backgroundActive = !!batchId && status === "IN_REVIEW" && pages.some(page => page.status === "PENDING" || page.status === "PROCESSING" || (page.status === "FAILED" && page.retryAt));
  useEffect(() => {
    if (!backgroundActive) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [backgroundActive, router]);
  const complete = pagesComplete(expectedPages, pages.map(page => page.pageNumber));
  const change = (reopen: boolean) => startTransition(async () => {
    setError("");
    try { const result = await (reopen ? reopenSubmission(id) : confirmSubmission(id)); if (result.error) { setError(result.error); return; } if (!reopen && batchId) { router.push(`/batches/${batchId}`); } else if (!reopen && existing) { await readAll(); } else router.refresh(); }
    catch { setError("Something went wrong. Refresh and try again."); }
  });
  const addNextStudent = () => startTransition(async () => {
    setError("");
    try {
      const result = await confirmAndAddBatchPaper(id, nextPages);
      if (result.error || !result.id) { setError(result.error || "Could not start the next paper."); return; }
      router.push(`/submissions/${encodeURIComponent(result.id)}`); router.refresh();
    } catch { setError("Could not start the next paper. Refresh and try again."); }
  });
  const changeCount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("count") ?? "");
    startTransition(async () => {
      setError(""); setNotice("");
      try { const result = await updateExpectedPages(id, value); if (result.error) { setError(result.error); return; } setNotice("Page count updated."); router.refresh(); }
      catch { setError("Could not update the page count. Please retry."); }
    });
  };
  async function uploadMany(files: File[]) {
    if (!files.length) return;
    const free = Array.from({ length: expectedPages }, (_, index) => index + 1).filter(number => !pages.some(page => page.pageNumber === number));
    if (files.length > free.length) { setError(`You selected ${files.length} photos, but only ${free.length} page slots are empty. Change the page count or remove a photo first.`); return; }
    if (files.some(file => !["image/jpeg", "image/png"].includes(file.type) || file.size > MAX_PHOTO_BYTES || !file.size)) { setError("Choose JPEG or PNG photos up to 8 MB each."); return; }
    setBatchBusy(true); setError(""); const failures: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setBatchProgress(`Uploading photo ${i + 1} of ${files.length}…`);
      try { const body = new FormData(); body.set("photo", files[i]); body.set("pageNumber", String(free[i])); const response = await fetch(`/api/submissions/${id}/pages`, { method: "POST", body }); const result = await response.json(); if (!response.ok) failures.push(`Page ${free[i]}: ${result.error || "Upload failed"}`); }
      catch { failures.push(`Page ${free[i]}: connection lost. Check your connection, refresh to see what was saved, then retry the missing page.`); }
    }
    setBatchProgress(""); setBatchBusy(false); if (failures.length) setError(failures.join(" · ")); else setNotice("Photos uploaded. Check their order below."); router.refresh();
  }
  async function move(page: Page, other: Page | undefined) {
    if (!other) return; setBatchBusy(true); setError("");
    try { const result = await swapPages(id, page.id, other.id); if (result.error) setError(result.error); else { setNotice(`Page order updated. Photo ${page.pageNumber} is now page ${other.pageNumber}.`); router.refresh(); } }
    catch { setError("Could not reorder pages. Refresh and try again."); } finally { setBatchBusy(false); }
  }
  async function readAll() {
    const now = Date.now();
    const waitingPages = pages.filter(page => page.status === "FAILED" && page.retryAt && new Date(page.retryAt).getTime() > now);
    const todo = pages.filter(page => page.status === "PENDING" || (page.status === "FAILED" && (!page.retryAt || new Date(page.retryAt).getTime() <= now)));
    if (!todo.length) { setError("No pages are ready to read. Check their status and retry time below."); return; }
    setBatchBusy(true); setError(""); const failures: string[] = [];
    for (let i = 0; i < todo.length; i++) {
      const page = todo[i]; setBatchProgress(`Reading page ${page.pageNumber} (${i + 1} of ${todo.length})…`);
      try {
        let attempts = 0;
        while (true) {
          const response = await fetch(`/api/submissions/${id}/pages/${page.id}/extract`, { method: "POST" });
          const result = await response.json();
          if (response.ok) break;
          const seconds = shortRetrySeconds(response.status, result.retryAfterSeconds, attempts);
          if (seconds !== null) {
            attempts++;
            for (let remaining = seconds; remaining > 0; remaining--) {
              setBatchProgress(`Waiting ${remaining}s for the reading service, then retrying page ${page.pageNumber}…`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (!mounted.current) return;
            }
            setBatchProgress(`Retrying page ${page.pageNumber}…`);
            continue;
          }
          failures.push(`Page ${page.pageNumber}: ${result.error || "Could not read"}`);
          break;
        }
        if (failures.length) break;
      } catch { failures.push(`Page ${page.pageNumber}: connection lost; refresh to check its status`); break; }
    }
    if (!failures.length && waitingPages.length) failures.push("Some pages were not read because their retry time had not arrived. Please retry unread pages.");
    setBatchProgress(""); setBatchBusy(false); if (failures.length) { setError(`${failures.join(" · ")} Completed pages are saved. Retry remaining pages or review manually.`); router.refresh(); } else { setNotice("Reading finished. Opening review…"); router.push(paperReviewUrl(id, reviewOrigin)); router.refresh(); }
  }
  return <><PendingScreen pending={pending || batchBusy} message={batchProgress || "Processing your paper…"} /><div className={styles.progress}><strong>{pages.length} / {expectedPages} pages uploaded</strong><span>{complete ? "All pages uploaded" : "Upload all pages before confirming"}</span></div>{!editable && <ReadingProgress papers={[{ status, expectedPages, pages }]} label="Paper reading progress" />}{editable && <details className={styles.countDetails}><summary>Change expected page count</summary><form onSubmit={changeCount} className={styles.countForm}><label htmlFor="page-count">Expected pages</label><input id="page-count" name="count" type="number" min="1" max={batchId ? "3" : "10"} defaultValue={expectedPages} required /><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Save count"}</button></form></details>}{editable && !complete && <div className={styles.paperUploadArea}><FileDropzone title="Add paper photos" description="Only include pages from this student’s paper." formats="JPEG or PNG · up to 8 MB per photo" accept="image/jpeg,image/png" disabled={batchBusy || pending} onFiles={uploadMany} onCamera={() => setCameraOpen(true)} showCamera={mobile} /></div>}{mobile && (cameraOpen || autoRequested) && <GuidedCamera pageNumbers={Array.from({ length: expectedPages }, (_, index) => index + 1).filter(number => !pages.some(page => page.pageNumber === number))} onClose={() => { setCameraOpen(false); setAutoRequested(false); }} onUpload={uploadMany} />}{batchProgress && <p role="status" className={styles.success}>{batchProgress}</p>}{notice && <div className={`${styles.feedbackNotice} ${styles.feedbackSuccess}`} role="status"><span className={styles.feedbackIcon} aria-hidden="true">✓</span><div><strong>All set</strong><p>{notice}</p></div></div>}{error && <div className={styles.feedbackNotice} role="alert"><Mascot state="concerned" width={48} height={48} className={styles.feedbackMascot} /><div><strong>Something needs attention</strong><p>{error}</p></div></div>}{!editable && !batchId && <p className={styles.description}>Selecting Extract answers sends that page photo to Groq; if it fails, OpenRouter or Gemini may be used. Review every answer against the photo.</p>}{pages.length > 0 && <div className={`${styles.pageGrid} ${styles.paperPageGrid} ${pages.length === 1 ? styles.paperPageGridSingle : ""}`}>
      {[...pages].sort((a, b) => a.pageNumber - b.pageNumber).map(page => {
        const earlier = pages.find(p => p.pageNumber === page.pageNumber - 1);
        const later = pages.find(p => p.pageNumber === page.pageNumber + 1);
        return <PageSlot key={page.id} submissionId={id} batchId={batchId} number={page.pageNumber} page={page} editable={editable} disabled={batchBusy || pending} canExtract={status === "IN_REVIEW" && !batchBusy} onEarlier={earlier ? () => move(page, earlier) : undefined} onLater={later ? () => move(page, later) : undefined} />;
      })}
    </div>}
    {editable && complete ? <div className={`${styles.confirm} ${styles.paperConfirm}`}>
      <h2>Ready to check?</h2>
      <p>Make sure these photos belong to the same student and are in page order.{(batchId || existing) && " Starting sends the photos to Groq for reading; if it fails, OpenRouter or Gemini may be used."}</p>
      {batchId && canAddPaper(batchPaperCount) && <details className={styles.nextPaperOptions}>
        <summary>Next paper: {nextPages} {nextPages === 1 ? "page" : "pages"} · Change</summary>
        <label htmlFor="next-paper-pages">Pages in the next student’s paper</label>
        <select id="next-paper-pages" value={nextPages} onChange={event => setNextPages(Number(event.target.value))} disabled={pending || batchBusy}><option value={1}>1 page</option><option value={2}>2 pages</option><option value={3}>3 pages</option></select>
      </details>}
      <div className={styles.paperConfirmActions}>
        {batchId && canAddPaper(batchPaperCount) && <button className={styles.primary} type="button" disabled={pending || batchBusy} onClick={addNextStudent}>{pending || batchBusy ? "Starting…" : "Start checking & add next student"}</button>}
        <button className={batchId && canAddPaper(batchPaperCount) ? styles.secondary : styles.primary} type="button" disabled={pending || batchBusy} onClick={() => change(false)}>{pending || batchBusy ? "Starting…" : batchId ? "Start checking & return to batch" : existing ? "Start checking" : "Confirm pages"}</button>
      </div>
      {batchId && canAddPaper(batchPaperCount) && <p className={styles.paperConfirmHint}>This paper checks in the background. {MAX_BATCH_PAPERS - batchPaperCount} {MAX_BATCH_PAPERS - batchPaperCount === 1 ? "spot" : "spots"} left in this batch.</p>}
      {batchId && !canAddPaper(batchPaperCount) && <p>Batch full: {MAX_BATCH_PAPERS} papers.</p>}
    </div> : !editable ? <div className={styles.confirm}><h2>{batchId ? "Paper progress" : "Read and review"}</h2><p>{batchId ? "Checking continues in the background. Return to the batch to add or review other papers." : existing ? "Review flagged answers and essays before finalizing." : "Check suggestions against the original photo. No scores are assigned yet."}</p>{!batchId && status === "IN_REVIEW" && <button type="button" className={styles.primary} disabled={batchBusy || !pages.some(page => page.status === "PENDING" || page.status === "FAILED")} onClick={readAll}>{batchBusy ? "Reading…" : "Retry unread pages"}</button>}<Link className={styles.secondary} href={paperReviewUrl(id, reviewOrigin)}>Review answers</Link>{status === "IN_REVIEW" && <button type="button" className={styles.secondary} disabled={pending} onClick={() => change(true)}>{pending ? "Opening…" : "Reopen page uploads"}</button>}</div> : null}</>;
}
