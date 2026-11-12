"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MAX_PHOTO_BYTES, pagesComplete } from "@/lib/submission-upload";
import { confirmSubmission, reopenSubmission, updateExpectedPages, swapPages } from "../actions";
import styles from "../submissions.module.css";

type Page = { id: string; pageNumber: number; status: string; error: string | null; retryAt: string | null };

function PageSlot({ submissionId, number, page, editable, canExtract }: { submissionId: string; number: number; page?: Page; editable: boolean; canExtract: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("photo");
    if (!(file instanceof File) || !file.size) { setMessage("Choose a photo first."); return; }
    if (file.size > MAX_PHOTO_BYTES) { setMessage("Photo must be 8 MB or smaller."); return; }
    setBusy(true); setMessage("");
    try {
      const body = new FormData(); body.set("photo", file); body.set("pageNumber", String(number));
      const response = await fetch(`/api/submissions/${submissionId}/pages`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Upload failed. Please retry."); return; }
      form.reset(); setMessage("Photo saved."); router.refresh();
    } catch { setMessage("Upload failed. Check your connection and retry this page."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!page || !window.confirm(`Remove the photo for page ${number}? You can upload a replacement.`)) return;
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
      const response = await fetch(`/api/submissions/${submissionId}/pages/${page.id}/extract`, { method: "POST" });
      const result = await response.json();
      setMessage(response.ok ? "Answers extracted. Review them against the photo." : result.error ?? "Could not process this page.");
      router.refresh();
    } catch { setMessage("Connection lost. Refresh to check the page status before retrying."); }
    finally { setBusy(false); }
  }
  return <section className={styles.pageCard}><div className={styles.pageTop}><h3>Page {number}</h3><span>{page ? "UPLOADED" : "MISSING"}</span></div>
    {page ? <><a href={`/api/submissions/${submissionId}/pages/${page.id}`} target="_blank" rel="noreferrer" aria-label={`Open page ${number} photo`}><Image className={styles.photo} src={`/api/submissions/${submissionId}/pages/${page.id}`} alt={`Uploaded photo of page ${number}`} width={500} height={400} unoptimized onLoad={() => setImageError(false)} onError={() => setImageError(true)} /></a>{imageError && <p className={styles.error} role="alert">This photo could not be loaded. {editable ? "Remove it and upload it again." : "Contact the app administrator."}</p>}{editable && <button type="button" className={styles.secondary} onClick={remove} disabled={busy}>{busy ? "Removing…" : "Remove / replace photo"}</button>}</> : editable ? <form onSubmit={upload} className={styles.uploadForm}><label htmlFor={`photo-${number}`}>Choose photo for page {number}</label><input id={`photo-${number}`} name="photo" type="file" accept="image/jpeg,image/png" required disabled={busy} /><button className={styles.secondary} disabled={busy}>{busy ? "Uploading…" : "Upload photo"}</button></form> : <p>Photo unavailable.</p>}
    {page && !editable && <div className={styles.extract}><p>Extraction: {page.status.toLowerCase()}</p>{page.error && <p className={styles.error}>{page.error}{page.retryAt && <> Retry after {new Date(page.retryAt).toLocaleString()}.</>}</p>}{canExtract && page.status !== "COMPLETE" && <button type="button" className={styles.secondary} disabled={busy} onClick={extract}>{busy ? "Reading photo…" : page.status === "PROCESSING" ? "Retry if stuck" : page.status === "FAILED" ? "Retry extraction" : "Extract answers"}</button>}</div>}
    {message && <p className={message === "Photo saved." || message.startsWith("Photo removed.") || message.startsWith("Answers extracted.") ? styles.success : styles.error} role="status">{message}</p>}
  </section>;
}

export default function PhotoPages({ id, expectedPages, status, pages, existing }: { id: string; expectedPages: number; status: string; pages: Page[]; existing: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");
  const editable = status === "DRAFT";
  const complete = pagesComplete(expectedPages, pages.map(page => page.pageNumber));
  const change = (reopen: boolean) => startTransition(async () => {
    setError("");
    try { const result = await (reopen ? reopenSubmission(id) : confirmSubmission(id)); if (result.error) { setError(result.error); return; } setChecked(false); if (!reopen && existing) { await readAll(); } else router.refresh(); }
    catch { setError("Something went wrong. Refresh and try again."); }
  });
  const changeCount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("count") ?? "");
    startTransition(async () => {
      setError(""); setNotice("");
      try { const result = await updateExpectedPages(id, value); if (result.error) { setError(result.error); return; } setChecked(false); setNotice("Page count updated."); router.refresh(); }
      catch { setError("Could not update the page count. Please retry."); }
    });
  };
  async function uploadMany(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = "";
    if (!files.length) return;
    const free = Array.from({ length: expectedPages }, (_, index) => index + 1).filter(number => !pages.some(page => page.pageNumber === number));
    if (files.length > free.length) { setError(`You selected ${files.length} photos, but only ${free.length} page slots are empty. Change the page count or remove a photo first.`); return; }
    if (files.some(file => !["image/jpeg", "image/png"].includes(file.type) || file.size > MAX_PHOTO_BYTES || !file.size)) { setError("Choose JPEG or PNG photos up to 8 MB each."); return; }
    setBatchBusy(true); setError(""); const failures: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setBatchProgress(`Uploading photo ${i + 1} of ${files.length}…`);
      try { const body = new FormData(); body.set("photo", files[i]); body.set("pageNumber", String(free[i])); const response = await fetch(`/api/submissions/${id}/pages`, { method: "POST", body }); const result = await response.json(); if (!response.ok) failures.push(`Page ${free[i]}: ${result.error || "Upload failed"}`); }
      catch { failures.push(`Page ${free[i]}: connection lost`); }
    }
    setBatchProgress(""); setBatchBusy(false); setChecked(false); if (failures.length) setError(failures.join(" · ")); else setNotice("Photos uploaded. Check their order below."); router.refresh();
  }
  async function move(page: Page, other: Page | undefined) {
    if (!other) return; setBatchBusy(true); setError("");
    try { const result = await swapPages(id, page.id, other.id); if (result.error) setError(result.error); else { setChecked(false); router.refresh(); } }
    catch { setError("Could not reorder pages. Refresh and try again."); } finally { setBatchBusy(false); }
  }
  async function readAll() {
    const todo = pages.filter(page => page.status === "PENDING" || (page.status === "FAILED" && (!page.retryAt || new Date(page.retryAt).getTime() <= Date.now())));
    if (!todo.length) { setError("No pages are ready to read. Check their status and retry time below."); return; }
    setBatchBusy(true); setError(""); const failures: string[] = [];
    for (let i = 0; i < todo.length; i++) {
      const page = todo[i]; setBatchProgress(`Reading page ${page.pageNumber} (${i + 1} of ${todo.length})…`);
      try { const response = await fetch(`/api/submissions/${id}/pages/${page.id}/extract`, { method: "POST" }); const result = await response.json(); if (!response.ok) { failures.push(`Page ${page.pageNumber}: ${result.error || "Could not read"}`); if (response.status === 429) break; } }
      catch { failures.push(`Page ${page.pageNumber}: connection lost; refresh to check its status`); }
    }
    setBatchProgress(""); setBatchBusy(false); if (failures.length) { setError(`${failures.join(" · ")} Completed pages are saved. Retry remaining pages or review manually.`); router.refresh(); } else { setNotice("Reading finished. Opening review…"); router.push(`/submissions/${id}/review`); router.refresh(); }
  }
  return <><div className={styles.progress}><strong>{pages.length} / {expectedPages} pages uploaded</strong><span>{complete ? "All pages uploaded" : "Upload all pages before confirming"}</span></div>{editable && <details className={styles.countDetails}><summary>Change expected page count</summary><form onSubmit={changeCount} className={styles.countForm}><label htmlFor="page-count">Expected pages</label><input id="page-count" name="count" type="number" min="1" max="10" defaultValue={expectedPages} required /><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Save count"}</button></form></details>}{editable && <div className={styles.confirm}><h2>Add page photos</h2><p>Select several photos in page order. On supported phones, use the camera option to take a photo. You can remove and replace a page before confirming.</p><label className={styles.uploadForm}>Choose photos<input type="file" accept="image/jpeg,image/png" multiple disabled={batchBusy || pending} onChange={uploadMany} /></label><label className={styles.uploadForm}>Take a photo (supported phones)<input type="file" accept="image/jpeg,image/png" capture="environment" disabled={batchBusy || pending} onChange={uploadMany} /></label></div>}{batchProgress && <p role="status" className={styles.success}>{batchProgress}</p>}{notice && <p className={styles.success} role="status">{notice}</p>}{!editable && <p className={styles.description}>Selecting Extract answers sends that page photo to Groq. Review every answer against the photo.</p>}<div className={styles.pageGrid}>{Array.from({ length: expectedPages }, (_, i) => <div key={i + 1}><PageSlot submissionId={id} number={i + 1} page={pages.find(p => p.pageNumber === i + 1)} editable={editable && !batchBusy} canExtract={status === "IN_REVIEW" && !batchBusy} />{editable && pages.find(p => p.pageNumber === i + 1) && <div className={styles.reorder}><button type="button" className={styles.secondary} disabled={batchBusy || pending || !pages.find(p => p.pageNumber === i)} onClick={() => move(pages.find(p => p.pageNumber === i + 1)!, pages.find(p => p.pageNumber === i))}>Move earlier</button><button type="button" className={styles.secondary} disabled={batchBusy || pending || !pages.find(p => p.pageNumber === i + 2)} onClick={() => move(pages.find(p => p.pageNumber === i + 1)!, pages.find(p => p.pageNumber === i + 2))}>Move later</button></div>}</div>)}</div>
    {editable ? <div className={styles.confirm}><h2>Check page order</h2><p>Open each photo and make sure it matches its page number. Missing or repeated pages need your attention.</p><label className={styles.check}><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} disabled={!complete || pending} /> I checked that all pages are present and in the correct order.</label>{existing && <p>Starting sends these page photos to Groq for reading.</p>}<button className={styles.primary} type="button" disabled={!complete || !checked || pending || batchBusy} onClick={() => change(false)}>{pending || batchBusy ? "Starting…" : existing ? "Start checking" : "Confirm pages"}</button></div> : <div className={styles.confirm}><h2>Read and review</h2><p>Reading sends the selected page photos to Groq. {existing ? "Clear objective answers are checked automatically; review flagged answers and essays before finalizing." : "Check suggestions against the original photo. No scores are assigned yet."}</p>{status === "IN_REVIEW" && <button type="button" className={styles.primary} disabled={batchBusy || !pages.some(page => page.status === "PENDING" || page.status === "FAILED")} onClick={readAll}>{batchBusy ? "Reading…" : "Retry unread pages"}</button>}<Link className={styles.secondary} href={`/submissions/${id}/review`}>Review answers</Link>{status === "IN_REVIEW" && <button type="button" className={styles.secondary} disabled={pending} onClick={() => change(true)}>{pending ? "Opening…" : "Reopen page uploads"}</button>}</div>}{error && <p className={styles.error} role="alert">{error}</p>}</>;
}
