"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PendingScreen } from "@/app/pending-screen";
import LibraryIcon from "@/app/library-icon";
import { applyImportedKey, parseImportedDraft, type ImportRow, type ImportType } from "@/lib/quiz-import";
import { isPdfFile, withinAnswerKeyPhotoLimit } from "@/lib/answer-key-file-policy";
import { documentNeedsReview } from "@/lib/extraction";
import { clipboardImages } from "@/lib/clipboard-images";
import { saveImportedQuiz } from "./actions";
import styles from "./import.module.css";

type KeyItem = { number: number; answer: string; uncertain: boolean };
type Preview = { name: string; url: string; pdf: boolean };
const types: { value: ImportType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" }, { value: "TRUE_FALSE", label: "True or false" },
  { value: "IDENTIFICATION", label: "Identification" }, { value: "ESSAY", label: "Essay" },
];

async function imagePages(files: File[], report: (message: string) => void): Promise<Blob[]> {
  if (files.length > 10) throw new Error("Choose at most 10 files.");
  const images: Blob[] = [];
  for (const [index, file] of files.entries()) {
    const pdf = isPdfFile(file);
    if (!file.size || file.size > (pdf ? 10_000_000 : 8_000_000) || (!pdf && !["image/jpeg", "image/png"].includes(file.type))) throw new Error(`${file.name}: use a PDF under 10 MB or a JPEG/PNG under 8 MB.`);
    report(`Preparing file ${index + 1} of ${files.length}…`);
    if (!pdf) { images.push(file); }
    else {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
      try {
        const document = await task.promise;
        if (images.length + document.numPages > 10) throw new Error("Use at most 10 pages in each upload.");
        for (let number = 1; number <= document.numPages; number++) {
          report(`Preparing ${file.name}, page ${number} of ${document.numPages}…`);
          const page = await document.getPage(number);
          try {
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(base.width, base.height)) });
            const canvas = window.document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext("2d"); if (!context) throw new Error("Could not prepare the PDF page.");
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
            if (!blob) throw new Error("Could not prepare the PDF page.");
            images.push(blob);
          } finally { page.cleanup(); }
        }
      } finally { await task.destroy(); }
    }
    if (images.length > 10) throw new Error("Use at most 10 pages in each upload.");
  }
  return images;
}

export default function ImportQuizForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [quizFiles, setQuizFiles] = useState<File[]>([]);
  const [keyFiles, setKeyFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [keyPreviews, setKeyPreviews] = useState<Preview[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [scanned, setScanned] = useState(false);
  const [filesChanged, setFilesChanged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const keyInput = useRef<HTMLInputElement>(null);
  const leavingAfterSave = useRef(false);
  useEffect(() => () => { previews.forEach(preview => URL.revokeObjectURL(preview.url)); }, [previews]);
  useEffect(() => () => { keyPreviews.forEach(preview => URL.revokeObjectURL(preview.url)); }, [keyPreviews]);
  useEffect(() => {
    if (!scanned && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { if (!leavingAfterSave.current) event.preventDefault(); };
    const warnNavigation = (event: MouseEvent) => {
      if (leavingAfterSave.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      if (!window.confirm("Leave this import? Scan progress, unsaved review and selected files will be lost.")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", warnNavigation, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", warnNavigation, true); };
  }, [scanned, busy]);
  function selectQuiz(files: File[]) {
    setQuizFiles(files);
    setPreviews(files.map(file => ({ name: file.name, url: URL.createObjectURL(file), pdf: isPdfFile(file) })));
    if (scanned) setFilesChanged(true);
  }
  function selectKey(files: File[]) {
    if (!withinAnswerKeyPhotoLimit(files)) { setError("Choose at most 2 answer key photos. Your previous selection is unchanged."); if (keyInput.current) keyInput.current.value = ""; return; }
    setError("");
    setKeyFiles(files);
    setKeyPreviews(files.map(file => ({ name: file.name, url: URL.createObjectURL(file), pdf: isPdfFile(file) })));
    if (scanned) setFilesChanged(true);
  }
  function edit(index: number, patch: Partial<ImportRow>) { setRows(previous => previous.map((row, i) => i === index ? { ...row, ...patch } : row)); }
  function move(index: number, direction: -1 | 1) {
    setRows(previous => {
      const destination = index + direction;
      if (destination < 0 || destination >= previous.length) return previous;
      const next = [...previous]; [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }
  async function scan() {
    if (!quizFiles.length || busy) return;
    if (rows.length && !window.confirm("Scan again and replace your current review edits?")) return;
    setScanning(true); setBusy(true); setError(""); setNotice("");
    try {
      const pages = await imagePages(quizFiles, setProgress);
      const extracted: ImportRow[] = [];
      let emptyPages = 0;
      const questionable: string[] = [];
      for (const [index, image] of pages.entries()) {
        setProgress(`Scanning quiz page ${index + 1} of ${pages.length}…`);
        const data = new FormData(); data.set("file", image, "quiz-page.jpg");
        const response = await fetch("/api/quizzes/import/extract", { method: "POST", body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not scan this quiz page.");
        if (documentNeedsReview(result.document)) questionable.push(`quiz page ${index + 1}`);
        if (!result.questions.length) emptyPages++;
        extracted.push(...result.questions);
        if (extracted.length > 200) throw new Error("A quiz can contain at most 200 questions.");
      }
      if (!extracted.length) throw new Error("No recognizable quiz questions were found across the uploaded pages. Check the files or try clearer images.");
      let reviewed = extracted;
      let noKeyAnswers = false;
      if (keyFiles.length) {
        const keyPages = await imagePages(keyFiles, setProgress);
        const keyItems: KeyItem[] = [];
        for (const [index, image] of keyPages.entries()) {
          setProgress(`Scanning answer key page ${index + 1} of ${keyPages.length}…`);
          const data = new FormData(); data.set("file", image, "key-page.jpg");
          const response = await fetch("/api/answer-key/extract", { method: "POST", body: data });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Could not scan the answer key.");
          if (documentNeedsReview(result.document)) questionable.push(`answer key page ${index + 1}`);
          keyItems.push(...result.items);
        }
        reviewed = applyImportedKey(extracted, keyItems);
        noKeyAnswers = !keyItems.some(item => item.answer?.trim());
      }
      if (questionable.length && !window.confirm(`Check ${questionable.join(", ")}: the scan could not confidently identify the page. Continue to review the extracted content?`)) return;
      setRows(reviewed);
      setScanned(true); setFilesChanged(false);
      setNotice(`${reviewed.length} questions found.${emptyPages ? ` No complete questions were found on ${emptyPages} page(s).` : ""}${noKeyAnswers ? " No recognizable answers were found in the answer key; add them manually." : ""}${questionable.length ? ` Check: ${questionable.join(", ")}.` : ""} Compare every question, choice and answer with the original. Questions may be missing or split across pages.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not scan the files. Please try again."); }
    finally { setBusy(false); setScanning(false); setProgress(""); }
  }
  async function save() {
    if (busy || filesChanged) return;
    if (!parseImportedDraft(rows)) { setError("Check that every question has text, valid choices and a valid answer if provided."); return; }
    setBusy(true); setProgress("Saving your imported quiz…"); setError("");
    try {
      const result = await saveImportedQuiz(title, rows);
      if (result.error || !result.id) { setError(result.error || "Could not save the quiz."); return; }
      leavingAfterSave.current = true;
      router.push(`/quizzes/${encodeURIComponent(result.id)}`); router.refresh();
    } catch { leavingAfterSave.current = false; setError("Could not save the quiz. Please try again."); }
    finally { setBusy(false); setProgress(""); }
  }
  const missing = rows.filter(row => row.type !== "ESSAY" && !row.answer.trim()).length;
  return <div className={styles.importer}>
    <PendingScreen pending={busy} mood={scanning ? "thinking" : "working"} message={progress || "Processing your quiz…"} />
    <div className={styles.steps} aria-label="Import progress"><span aria-current={!scanned ? "step" : undefined}>Choose files</span><span aria-hidden="true" className={styles.stepLine} /><span aria-current={scanned ? "step" : undefined}>Review questions</span></div>
    <fieldset className={styles.formFields} disabled={busy}>
    <section className={styles.panel} aria-labelledby="import-files-heading"><div><h2 id="import-files-heading">Start with your files</h2><p>Upload your quiz and an answer key if you have one.</p></div>
      <label>Quiz title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder="e.g. Science Quiz 1" /></label>
      <div className={styles.uploadCards}>
        <div className={styles.pasteArea} tabIndex={0} role="group" aria-label="Quiz files; paste screenshots here" onPaste={event => { if (busy) return; const images = clipboardImages(event.clipboardData.items); if (images.length) { event.preventDefault(); selectQuiz([...quizFiles, ...images]); } }}>
          <span className={styles.fileIcon}><LibraryIcon type="quiz" /></span>
          <div><strong>Quiz document</strong><p>Choose a PDF or clear photos of your quiz.</p></div>
          <label className={styles.fileButton}>Choose quiz files<input className={styles.fileInput} aria-label="Choose quiz files" type="file" accept="application/pdf,image/jpeg,image/png" multiple disabled={busy} onChange={event => selectQuiz(Array.from(event.currentTarget.files ?? []))} /></label>
          <small>{quizFiles.length ? `${quizFiles.length} ${quizFiles.length === 1 ? "file" : "files"} selected` : "No files selected"} · Paste screenshots here with Ctrl+V</small>
          {quizFiles.length > 0 && <ul className={styles.fileNames}>{quizFiles.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}</ul>}
        </div>
        <div className={styles.pasteArea} tabIndex={0} role="group" aria-label="Answer key files; paste screenshots here" onPaste={event => { if (busy) return; const images = clipboardImages(event.clipboardData.items); if (images.length) { event.preventDefault(); selectKey([...keyFiles, ...images]); } }}>
          <span className={styles.fileIcon}><LibraryIcon type="key" /></span>
          <div><strong>Answer key</strong> <span className={styles.optional}>Optional</span><p>Add a separate key to match answers to questions.</p></div>
          <label className={styles.fileButton}>Choose answer key<input className={styles.fileInput} aria-label="Choose answer key" ref={keyInput} type="file" accept="application/pdf,image/jpeg,image/png" multiple disabled={busy} onChange={event => selectKey(Array.from(event.currentTarget.files ?? []))} /></label>
          <small>{keyFiles.length ? `${keyFiles.length} ${keyFiles.length === 1 ? "file" : "files"} selected` : "No files selected"} · Paste screenshots here with Ctrl+V</small>
          {keyFiles.length > 0 && <><ul className={styles.fileNames}>{keyFiles.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}</ul><button type="button" className={styles.removeKey} disabled={busy} onClick={() => { if (keyInput.current) keyInput.current.value = ""; selectKey([]); }}>Remove answer key</button></>}
        </div>
      </div>
      <p className={styles.fileHelp}>PDF, JPEG or PNG · Up to 10 pages per upload · Answer key: up to 2 photos<br />PDFs: 10 MB per file · Photos: 8 MB each. Supports multiple choice, true/false, identification and essay questions.</p>
      <p className={styles.privacyNote}>Files are sent to Groq for scanning. Avoid uploading sensitive information.</p>
      <div className={styles.scanActions}><Link href="/quizzes/new">Create a quiz from scratch</Link><button type="button" disabled={busy || !quizFiles.length} onClick={scan}>{busy ? "Working…" : "Scan quiz"} <span aria-hidden="true">→</span></button></div>
    </section>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {filesChanged && <p role="status" className={styles.notice}>Files changed. Scan again before saving; your current review stays here until a new scan succeeds.</p>}
    {scanned && <section className={styles.review} aria-labelledby="import-review-heading"><h2 id="import-review-heading">Review your quiz</h2>
      <p>Files are scanned in selection order; use the arrows to correct question order. Open the originals while checking the scan. Saved quiz numbering starts at 1 and continues across sections. Each question starts at 1 point; essay rubrics are editable in the quiz editor.</p>
      <div className={styles.sources}>{previews.map(preview => <a key={preview.url} href={preview.url} target="_blank" rel="noreferrer">Open {preview.name} ↗</a>)}</div>
      {keyPreviews.length > 0 && <div className={styles.sources}>{keyPreviews.map(preview => <a key={preview.url} href={preview.url} target="_blank" rel="noreferrer">Open answer key: {preview.name} ↗</a>)}</div>}
      {missing > 0 && <p className={styles.notice}>{missing} {missing === 1 ? "question needs" : "questions need"} an answer. You can save the draft and add answers later; complete them before printing or checking.</p>}
      {rows.map((row, index) => <article className={styles.question} key={index}><div className={styles.rowTop}><h3>Question {index + 1}</h3><div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`Move question ${index + 1} up`}>↑</button><button type="button" className={styles.secondary} disabled={busy || index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`Move question ${index + 1} down`}>↓</button><button type="button" className={styles.secondary} disabled={busy} onClick={() => setRows(previous => previous.filter((_, i) => i !== index))}>Remove</button></div></div>
        <div className={styles.columns}><label>Printed number<input type="number" min="1" max="500" value={row.number} onChange={event => edit(index, { number: Number(event.target.value), answer: "" })} /></label><label>Type<select value={row.type} onChange={event => edit(index, { type: event.target.value as ImportType, choices: [], answer: "" })}>{types.map(type => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label></div>
        <label>Section title<input value={row.sectionTitle} maxLength={120} onChange={event => edit(index, { sectionTitle: event.target.value })} placeholder="Same section as previous question" /></label>
        <label>Section instructions<textarea value={row.directions} maxLength={1000} rows={2} onChange={event => edit(index, { directions: event.target.value })} /></label>
        <label>Question<textarea value={row.text} maxLength={2000} rows={3} onChange={event => edit(index, { text: event.target.value })} /></label>
        {row.type === "MULTIPLE_CHOICE" && <div className={styles.columns}>{["A", "B", "C", "D"].map(label => <label key={label}>Choice {label}<input maxLength={500} value={row.choices.find(choice => choice.label === label)?.text ?? ""} onChange={event => { const value = event.target.value; const choices = ["A", "B", "C", "D"].map(key => ({ label: key, text: key === label ? value : row.choices.find(choice => choice.label === key)?.text ?? "" })).filter(choice => choice.text.trim()); edit(index, { choices }); }} /></label>)}</div>}
        {row.type !== "ESSAY" && <label>Correct answer <span>(optional for now)</span><input maxLength={500} value={row.answer} onChange={event => edit(index, { answer: event.target.value })} placeholder={row.type === "MULTIPLE_CHOICE" ? "A, B, C or D" : row.type === "TRUE_FALSE" ? "T or F" : "Accepted answers, separated by |"} /></label>}
      </article>)}
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy || rows.length >= 200} onClick={() => setRows(previous => [...previous, { number: previous.length + 1, text: "", type: "MULTIPLE_CHOICE", choices: [], sectionTitle: "", directions: "", answer: "" }])}>+ Add missing question</button><button type="button" disabled={busy || filesChanged || !title.trim() || !rows.length} onClick={save}>Save quiz draft</button></div>
    </section>}
    </fieldset>
  </div>;
}
