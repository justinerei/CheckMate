"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createExisting, type KeyRow } from "./actions";
import { isPdfFile, MAX_ANSWER_KEY_PHOTOS, withinAnswerKeyPhotoLimit } from "@/lib/answer-key-file-policy";
import { hasReadableKeyAnswer } from "@/lib/answer-key-reading";
import { answerKeyReturnPath } from "@/lib/answer-key-navigation";
import { groupExtractedKeyRows } from "@/lib/answer-key-sections";
import EssayRubric from "./essay-rubric";
import ScanNotification from "./scan-notification";
import { validateRubric } from "@/lib/rubric";
import { hasAnswerKeyDraft } from "@/lib/answer-key-draft";
import FileDropzone from "../../submissions/file-dropzone";
import GuidedCamera from "../../submissions/[id]/guided-camera";
import { isMobileCaptureDevice } from "@/lib/mobile-capture";
import styles from "../../submissions/submissions.module.css";

const subscribeDevice = () => () => {};
const serverDevice = () => false;
function mobileDevice() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return isMobileCaptureDevice(nav.userAgent, nav.platform, nav.maxTouchPoints, nav.userAgentData?.mobile);
}

const blank = (number: number): KeyRow => ({ number, section: 1, answer: "", type: "MULTIPLE_CHOICE", style: "written", points: 1, directions: "" });
export default function KeyForm({ teacherId, fromChecking = false }: { teacherId: string; fromChecking?: boolean }) {
  const router = useRouter();
  const draftKey = `checkmate-existing-key-draft-${teacherId}`;
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<KeyRow[]>([blank(1)]);
  const [error, setError] = useState("");
  const [, setUploadError] = useState("");
  const [notification, setNotification] = useState<{ message: string; error: boolean } | null>(null);
  const reportUploadError = (message: string) => { setUploadError(message); setNotification(message ? { message, error: true } : null); };
  const [busy, setBusy] = useState(false);
  const mobile = useSyncExternalStore(subscribeDevice, mobileDevice, serverDevice);
  const [cameraTarget, setCameraTarget] = useState<number | "add" | null>(null);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState("");
  const [otherPreviews, setOtherPreviews] = useState<{ name: string; url: string }[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [progress, setProgress] = useState("");
  const previewPanelRef = useRef<HTMLElement>(null);
  const scanCache = useRef(new Map<File, { rows: KeyRow[]; pages: number }>());
  const [scanItems, setScanItems] = useState<{ name: string; message: string; ok: boolean }[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => { try { const raw = localStorage.getItem(draftKey); if (raw) { const draft = JSON.parse(raw); if (Array.isArray(draft.rows) && typeof draft.title === "string") { setRows(draft.rows); setTitle(draft.title); setReviewStarted(draft.reviewStarted ?? hasAnswerKeyDraft(draft.title, draft.rows)); } } } catch {} setDraftReady(true); }, 0); return () => window.clearTimeout(timer); }, [draftKey]);
  useEffect(() => { if (!draftReady) return; try { if (hasAnswerKeyDraft(title, rows)) localStorage.setItem(draftKey, JSON.stringify({ title, rows, reviewStarted })); else localStorage.removeItem(draftKey); } catch {} }, [title, rows, reviewStarted, draftReady, draftKey]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (hasAnswerKeyDraft(title, rows)) { event.preventDefault(); } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [title, rows]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (!preview || !window.matchMedia("(max-width: 700px)").matches) return; const frame = requestAnimationFrame(() => previewPanelRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })); return () => cancelAnimationFrame(frame); }, [preview]);
  useEffect(() => () => { otherPreviews.forEach(item => URL.revokeObjectURL(item.url)); }, [otherPreviews]);
  const update = (index: number, patch: Partial<KeyRow>) => setRows(old => old.map((r, i) => i === index ? { ...r, ...patch } : r));
  async function selectFiles(incoming: File[], append = false, updateSelection = false) {
    const selected = append ? [...files, ...incoming] : incoming;
    if (!withinAnswerKeyPhotoLimit(selected)) { reportUploadError("Choose at most 2 answer key photos. Your previous selection is unchanged."); return; }
    if (selected.length > 10 || selected.some(f => !f.size || !(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf") || ["image/jpeg", "image/png"].includes(f.type)) || f.size > (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf") ? 10_000_000 : 8_000_000))) { reportUploadError("Choose up to 10 PDF, JPEG, or PNG files. PDFs must be under 10 MB and photos under 8 MB each."); return; }
    if (!append && !updateSelection && files.length && !window.confirm("Replace all selected answer key files?")) return;
    reportUploadError(""); setScanItems([]); setFiles(selected); setFile(selected[0] ?? null); setPreview(selected[0] ? URL.createObjectURL(selected[0]) : ""); setOtherPreviews(selected.slice(1).map(f => ({ name: f.name, url: URL.createObjectURL(f) })));
    if (!selected.length) { setProgress(""); return; }
    setProgress("");
  }
  async function checkFiles(selected: File[]): Promise<KeyRow[] | null> {
    setBusy(true);
    const statuses: { name: string; message: string; ok: boolean }[] = [];
    const allRows: KeyRow[] = [];
    let totalPages = 0;
    try {
      for (const [index, selectedFile] of selected.entries()) {
        setProgress(`Checking file ${index + 1} of ${selected.length}…`);
        try {
          const isPdf = isPdfFile(selectedFile);
          let cached = scanCache.current.get(selectedFile);
          if (!cached) {
            const images: Blob[] = [];
            if (isPdf) {
              const pdfjs = await import("pdfjs-dist");
              pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
              const loading = pdfjs.getDocument({ data: await selectedFile.arrayBuffer() });
              const pdf = await loading.promise;
              try {
                if (pdf.numPages > 10) throw new Error("The PDF can have at most 10 pages.");
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                  const page = await pdf.getPage(pageNumber); const base = page.getViewport({ scale: 1 }); const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(base.width, base.height)) });
                  const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d"); if (!context) throw new Error("Could not prepare PDF page.");
                  await page.render({ canvas, canvasContext: context, viewport }).promise;
                  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9)); if (!blob) throw new Error("Could not prepare PDF page."); images.push(blob);
                }
              } finally { await loading.destroy(); }
            } else images.push(selectedFile);
            if (totalPages + images.length > 10) throw new Error("The answer key can have at most 10 pages in total.");
            const detected: KeyRow[] = [];
            for (const image of images) {
              const data = new FormData(); data.set("file", image, "key.jpg");
              const response = await fetch("/api/answer-key/extract", { method: "POST", body: data }); const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Could not check this file.");
              detected.push(...result.items.map((item: Partial<KeyRow>) => ({ ...blank(Number(item.number)), ...item, section: 1, points: 1 })));
            }
            if (!hasReadableKeyAnswer(detected)) throw new Error("No answers found. Retake in good lighting, choose a clearer file, or enter answers manually.");
            cached = { rows: detected, pages: images.length }; scanCache.current.set(selectedFile, cached);
          }
          totalPages += cached.pages;
          if (totalPages > 10) throw new Error("The answer key can have at most 10 pages in total.");
          allRows.push(...cached.rows); statuses.push({ name: selectedFile.name, message: "Answers detected — check the preview", ok: true });
        } catch (err) { statuses.push({ name: selectedFile.name, message: err instanceof TypeError ? "Could not connect. Check your connection, then retry the file check. You can also enter answers manually." : err instanceof Error ? err.message : "Could not read this file. Retry the file check or enter answers manually.", ok: false }); }
        setScanItems([...statuses]);
      }
      if (statuses.every(item => item.ok)) {
        setNotification({ message: "Scan complete. Review the detected answers.", error: false });
        return allRows;
      }
      const failed = statuses.find(item => !item.ok);
      reportUploadError(failed ? `File ${statuses.indexOf(failed) + 1}: ${failed.message}` : "Some files need attention. Your current answers have not been changed.");
      return null;
    } finally { setBusy(false); setProgress(""); }
  }
  function replacePage(index: number, replacement: File) {
    const updated = files.map((item, i) => i === index ? replacement : item);
    void selectFiles(updated, false, true);
  }
  function removePage(index: number) {
    if (!window.confirm(`Remove ${files[index].name} from this answer key?`)) return;
    const updated = files.filter((_, i) => i !== index);
    void selectFiles(updated, false, true);
  }
  function retryChecks() {
    void extract();
  }
  async function extract() {
    if (!files.length || busy) return;
    if (hasAnswerKeyDraft("", rows) && !window.confirm("Scanning this key will replace the answers and criteria currently entered. Continue?")) return;
    reportUploadError("");
    const results = await checkFiles(files);
    if (!results || !hasReadableKeyAnswer(results)) { if (results) reportUploadError("No answers found. Retake in good lighting, choose a clearer file, or enter answers manually."); return; }
    setRows(groupExtractedKeyRows(results)); setReviewStarted(true);
    requestAnimationFrame(() => document.getElementById("key-review-heading")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  }
  async function save() { setReviewStarted(true); setBusy(true); setError(""); try { const result = await createExisting(title, rows); if (result.error || !result.id) { setError(result.error || "Could not save the key."); return; } try { localStorage.removeItem(draftKey); } catch {} router.push(answerKeyReturnPath(result.id, fromChecking)); } catch { setError("Could not save the key. Please try again."); } finally { setBusy(false); } }
  const typeNames: Record<string, string> = { MULTIPLE_CHOICE: "Multiple choice", TRUE_FALSE: "True / false", IDENTIFICATION: "Identification", ESSAY: "Essay" };
  const mixedSections = new Set(rows.filter(row => rows.some(other => other.section === row.section && other.style !== row.style)).map(row => row.section));
  const styleNames: Record<string, string> = { written: "Write letter in blank", circle: "Circle", shade: "Shade", box: "Mark a box", text: "Written text" };
  const uncertain = rows.filter(row => row.uncertain).length;
  const photoCount = files.filter(item => !isPdfFile(item)).length;
  const missing = rows.filter(row => row.type !== "ESSAY" && !row.answer.trim()).length;
  const issues = rows.flatMap(row => row.uncertain ? [{ number: row.number, message: "Check this reading against the key." }] : row.type !== "ESSAY" && !row.answer.trim() ? [{ number: row.number, message: "Enter a correct answer." }] : row.type === "ESSAY" && (!row.rubricConfirmed || !validateRubric(row.rubric ?? [], row.points)) ? [{ number: row.number, message: "Review and confirm a rubric matching the points." }] : []);
  return <div className={styles.keySetup}><PendingScreen pending={busy} message={progress || "Processing your answer key…"} />
    {fromChecking && <nav className={styles.keySteps} aria-label="Checking workflow"><span aria-current={!reviewStarted ? "step" : undefined}><b>1</b> Upload key</span><span aria-current={reviewStarted ? "step" : undefined}><b>2</b> Review answers</span><span><b>3</b> Upload student paper</span><span><b>4</b> Check results</span></nav>}
    {!reviewStarted && <section className={`${styles.keyPanel} ${styles.keyStage}`} aria-labelledby="key-upload-heading">
      <div className={styles.keyHeading}><div><p className={styles.keyEyebrow}>01 / SET UP</p><h2 id="key-upload-heading">Set up your key</h2></div></div>
      <label className={styles.keyLabel}>Quiz title<input className={styles.keyInput} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Science quiz" /></label>
      <FileDropzone hidden={!!file} title="Upload your key" description="Use clear, well-lit pages." formats="Up to 2 JPEG/PNG photos · 8 MB each · PDF up to 10 MB · 10 pages total" accept="application/pdf,image/jpeg,image/png" disabled={busy} onFiles={selectFiles} showCamera={mobile} onCamera={() => setCameraTarget("add")} />
      {notification && <ScanNotification message={notification.message} error={notification.error} onDismiss={() => setNotification(null)} />}
      {file && <section ref={previewPanelRef} className={styles.uploadPreviewPanel} aria-label="Selected answer key files">
        <div className={styles.uploadPreviewHeader}><div><strong>Review your files</strong><p>Check the pages before scanning.</p><p aria-live="polite">{photoCount} of {MAX_ANSWER_KEY_PHOTOS} photos selected · PDFs do not count toward the photo limit</p></div><span>{files.length} {files.length === 1 ? "file" : "files"}</span></div>
        <div className={styles.uploadPreviewActions}><label className={styles.previewReplace}><span>+ Add photos or PDF</span><input type="file" accept="application/pdf,image/jpeg,image/png" multiple disabled={busy} onChange={e => { const selected = Array.from(e.currentTarget.files ?? []); e.currentTarget.value = ""; if (selected.length) selectFiles(selected, true); }} /></label>{mobile && <button type="button" className={styles.previewReplace} disabled={busy || files.length >= 10 || photoCount >= MAX_ANSWER_KEY_PHOTOS} onClick={() => setCameraTarget("add")}>+ Add photo with camera</button>}</div>
        <div className={styles.previewPages}>{files.map((item, index) => {
          const url = index === 0 ? preview : otherPreviews[index - 1]?.url;
          const status = scanItems[index];
          return <article className={styles.previewPage} key={`${index}-${item.name}`}>
            <div className={styles.previewPageHead}><strong>File {index + 1}</strong><span title={item.name}>{item.name}</span></div>
            {isPdfFile(item) ? <div className={styles.uploadPdf}><strong>PDF document</strong>{url && <a href={url} target="_blank" rel="noreferrer">Open PDF preview ↗</a>}</div> : url && <img className={styles.uploadPreviewImage} src={url} alt={`Answer key photo ${index + 1}`} />}
            <div className={styles.previewPageBottom}><span className={status && !status.ok ? styles.scanWarning : styles.scanOkay}>{status ? status.ok ? "Scanned" : "Needs attention" : "Ready to scan"}</span><div className={styles.previewPageActions}><label className={styles.previewReplace}><span>Replace file</span><input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={e => { const chosen = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (chosen) replacePage(index, chosen); }} /></label>{mobile && <button type="button" className={styles.previewReplace} disabled={busy} onClick={() => setCameraTarget(index)}>↻ Retake photo</button>}<button type="button" className={styles.previewRemove} disabled={busy} onClick={() => removePage(index)}>Remove</button></div></div>
          </article>;
        })}</div>
        <div className={styles.uploadPreviewActions}><button className={styles.primary} type="button" onClick={extract} disabled={busy || !files.length}>{busy ? "Scanning…" : "Scan answer key →"}</button></div>
        <p className={styles.help}>When you select Scan answer key, the selected pages are sent to Groq. Review the results before saving.</p>
        {progress && <p className={styles.help} role="status">{progress}</p>}
        {scanItems.some(item => !item.ok) && <button type="button" className={styles.retryCheck} disabled={busy} onClick={retryChecks}>↻ Retry scan</button>}
      </section>}
      <button type="button" className={styles.manualEntry} disabled={busy} onClick={() => { setNotification(null); setReviewStarted(true); requestAnimationFrame(() => document.getElementById("key-review-heading")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })); }}>Enter answers manually →</button>
    </section>}
    {cameraTarget !== null && <GuidedCamera kind="answer-key" pageNumbers={[cameraTarget === "add" ? files.length + 1 : cameraTarget + 1]} onClose={() => setCameraTarget(null)} onUpload={async captured => { if (cameraTarget === "add") await selectFiles(captured, files.length > 0); else await selectFiles(files.map((item, index) => index === cameraTarget ? captured[0] : item), false, true); }} />}
    {reviewStarted && <section className={`${styles.keyPanel} ${styles.keyEditor} ${styles.keyStage}`} aria-labelledby="key-review-heading">
      <button type="button" className={styles.manualEntry} onClick={() => { setReviewStarted(false); setNotification(null); }}>← Back to answer key files</button>
      <div className={styles.keyHeading}><div><p className={styles.keyEyebrow}>02 / REVIEW</p><h2 id="key-review-heading">Review your answer key</h2><p>Check the answers and question types before saving.</p></div><span className={styles.keyCount}>{rows.length} {rows.length === 1 ? "question" : "questions"}</span></div>
      <label className={styles.keyLabel}>Quiz title<input className={styles.keyInput} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Science quiz" /></label>
      {reviewStarted && missing > 0 && <p className={styles.keyMissing} role="status">{missing} {missing === 1 ? "answer needs" : "answers need"} your attention. Check the highlighted fields.</p>}
      {reviewStarted && uncertain > 0 && <p className={styles.keyMissing} role="status">{uncertain} {uncertain === 1 ? "answer needs" : "answers need"} verification. Compare with the key, then confirm or correct each one.</p>}
      {reviewStarted && issues.length > 0 && <div className={styles.keyMissing} role="alert"><strong>Items to check</strong>{issues.map(issue => <p key={issue.number}><a href={`#key-question-${issue.number}`}>Question {issue.number}: {issue.message}</a></p>)}</div>}
      <div className={`${styles.keyReviewLayout} ${!preview ? styles.keyReviewSolo : ""}`}>
      {preview && <aside className={styles.keyPreview} aria-label="Original answer key"><div className={styles.previewHead}><strong>Original answer key</strong><span>Compare with the answers on the right.</span></div>{preview ? (file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf") ? <iframe title="Uploaded answer key PDF" src={preview} /> : <img src={preview} alt="Uploaded answer key" />) : <p>Choose a file above to see it here. You can also enter answers manually.</p>}{otherPreviews.map(item => <p key={item.url}><a href={item.url} target="_blank" rel="noreferrer">Open {item.name} ↗</a></p>)}</aside>}
      <div className={styles.keyList}>{rows.map((row, i) => <div className={styles.keyItem} key={i} id={`key-question-${row.number}`}>
        {(i === 0 || rows[i - 1].section !== row.section) && <div className={styles.sectionSettings}><div><strong>Section {row.section}</strong><span>Choose a type for all questions here, or change an individual question below.</span></div><label>Question type for this section<select aria-label={`Question type for section ${row.section}`} value={rows.filter(r => r.section === row.section).every(r => r.type === row.type) ? row.type : ""} onChange={e => { const type = e.target.value; if (!type) return; const affected = rows.filter(r => r.section === row.section && r.type !== type); if (affected.some(r => r.answer.trim() || r.rubric?.length) && !window.confirm("Change the question type? Existing answers and criteria will stay in the draft, but only the selected type will be used when saving.")) return; setRows(old => old.map(r => r.section === row.section ? { ...r, type, ...(type === "ESSAY" ? { style: "text" } : {}), rubricConfirmed: false } : r)); }}><option value="" disabled>Mixed types — choose to apply to all</option><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True / false</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label><label>Section name<input value={row.sectionTitle ?? ""} placeholder={`Section ${row.section}`} maxLength={120} onChange={e => { const sectionTitle = e.target.value; setRows(old => old.map(r => r.section === row.section ? { ...r, sectionTitle } : r)); }} /></label><label>How do students mark answers?<select value={row.style} onChange={e => { const style = e.target.value; setRows(old => old.map(r => r.section === row.section ? { ...r, style } : r)); }}><option value="written">Write letter in blank</option><option value="circle">Circle a choice</option><option value="shade">Shade a choice</option><option value="box">Mark a box</option><option value="text">Write text</option></select></label>{mixedSections.has(row.section) && <p className={styles.keyMissing}>This section contains different answer styles. Choose a style and apply it to all, or move questions with a different style into a new section. <button type="button" className={styles.secondary} onClick={() => setRows(old => old.map(r => r.section === row.section ? { ...r, style: row.style } : r))}>Apply shown style to all</button></p>}<label>Directions (optional)<input value={row.directions} onChange={e => { const directions = e.target.value; setRows(old => old.map(r => r.section === row.section ? { ...r, directions } : r)); }} /></label></div>}
        <div className={styles.keySummary}><span className={styles.keyNumber}> {String(row.number).padStart(2, "0")} </span><div className={styles.keyMeta}><strong>Question {row.number}</strong><span>Section {row.section} · {typeNames[row.type] ?? row.type} · {styleNames[row.style] ?? row.style}</span></div>{row.type !== "ESSAY" && <label className={styles.keyAnswer}>Correct answer<input aria-label={`Correct answer for question ${row.number}`} className={reviewStarted && !row.answer.trim() ? styles.keyNeedsAnswer : undefined} value={row.answer} onChange={e => update(i, { answer: e.target.value, uncertain: false })} placeholder="e.g. B" /></label>}<label className={styles.keyPoints}>Points<input aria-label={`Points for question ${row.number}`} type="number" min="0.01" step="0.01" max="9999" value={row.points} onChange={e => update(i, { points: Number(e.target.value), rubricConfirmed: false })} /></label><button type="button" className={styles.questionRemove} aria-label={`Remove question ${row.number}`} onClick={() => { if (window.confirm(`Remove question ${row.number}?`)) setRows(old => old.filter((_, n) => n !== i).map((r, n) => ({ ...r, number: n + 1 }))); }}>Remove</button></div>
        <label className={styles.questionType}>Question type <span className={styles.help}>Choose Essay to add grading criteria.</span><select value={row.type} aria-label={`Question type for question ${row.number}`} onChange={e => update(i, { type: e.target.value, rubricConfirmed: false })}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True / false</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label>
        {row.type === "ESSAY" && <EssayRubric row={row} onChange={patch => update(i, patch)} />}
        {row.uncertain && <div className={styles.keyUncertain}><span>AI was unsure. Check the original key.</span><button type="button" onClick={() => update(i, { uncertain: false })}>I checked this answer</button></div>}
        <details className={styles.keyDetails}><summary>Question settings</summary><div className={styles.keyFields}><label>Question #<input type="number" min="1" value={row.number} onChange={e => update(i, { number: Number(e.target.value) })} /></label><label>Section #<input type="number" min="1" value={row.section} onChange={e => { const section = Number(e.target.value); const target = rows.find(r => r.section === section); update(i, { section, ...(target ? { style: target.style, directions: target.directions, sectionTitle: target.sectionTitle } : {}) }); }} /></label></div></details>
        {(i === rows.length - 1 || rows[i + 1].section !== row.section) && <div className={styles.sectionActions}><button type="button" className={styles.sectionAdd} onClick={() => setRows(old => { const next = { ...blank(i + 2), section: row.section, sectionTitle: row.sectionTitle, type: row.type, style: row.style, directions: row.directions }; return [...old.slice(0, i + 1), next, ...old.slice(i + 1)].map((r, n) => ({ ...r, number: n + 1 })); })}><span aria-hidden="true">+</span> Add question</button><button type="button" className={styles.sectionRemove} onClick={() => { if (window.confirm(`Remove section ${row.section} and its questions?`)) setRows(old => old.filter(r => r.section !== row.section).map((r, n) => ({ ...r, number: n + 1 }))); }}>Remove section</button></div>}
      </div>)}</div>
      </div>
      <button type="button" className={styles.addSection} onClick={() => setRows(old => { const nextNumber = old.length ? Math.max(...old.map(r => r.number)) + 1 : 1; const nextSection = old.length ? Math.max(...old.map(r => r.section)) + 1 : 1; return [...old, { ...blank(nextNumber), section: nextSection }]; })}><span aria-hidden="true">+</span> Add section</button>
      <button type="button" className={styles.addSection} onClick={() => setRows(old => { const nextNumber = old.length ? Math.max(...old.map(r => r.number)) + 1 : 1; const nextSection = old.length ? Math.max(...old.map(r => r.section)) + 1 : 1; return [...old, { ...blank(nextNumber), section: nextSection, sectionTitle: "Essay", type: "ESSAY", style: "text", points: 5 }]; })}><span aria-hidden="true">+</span> Add essay section</button>
      <p className={styles.keyNote}>Use a new section when instructions or answer styles differ. Choose its answer style to match the student paper. For automatic erasure checks, write “No erasures.” as a separate sentence in that section’s directions. For multiple choice, enter the answer students will write (for example, B rather than B — Mars).</p>
      <p className={styles.keyNote}>Use consecutive question numbers starting at 1. Use | between alternative accepted answers. Essay points are assigned by the teacher during review.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.keyFinish}><p>{fromChecking ? "Your draft is saved in this browser. After saving, continue to the student paper." : "Your draft is saved in this browser. You can use the saved key to check papers later."}</p><button type="button" className={styles.primary} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save key"}</button></div>
    </section>}
  </div>;
}
