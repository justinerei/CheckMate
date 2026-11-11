"use client";
import { useEffect, useState } from "react";
import { createExisting, type KeyRow } from "./actions";
import styles from "../../submissions/submissions.module.css";

const blank = (number: number): KeyRow => ({ number, section: 1, answer: "", type: "MULTIPLE_CHOICE", style: "written", points: 1, directions: "" });
export default function KeyForm() {
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<KeyRow[]>([blank(1)]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const update = (index: number, patch: Partial<KeyRow>) => setRows(old => old.map((r, i) => i === index ? { ...r, ...patch } : r));
  async function extract() {
    if (!file) return;
    if (file.size > 10_000_000) { setError("The answer key must be under 10 MB."); return; }
    setBusy(true); setError("");
    try {
      let images: Blob[] = [];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const loading = pdfjs.getDocument({ data: await file.arrayBuffer() });
        const pdf = await loading.promise;
        if (pdf.numPages > 10) throw new Error("The PDF can have at most 10 pages.");
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(base.width, base.height)) });
          const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d"); if (!context) throw new Error("Could not prepare PDF page.");
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
          if (!blob) throw new Error("Could not prepare PDF page."); images.push(blob);
        }
        await loading.destroy();
      } else if (["image/jpeg", "image/png"].includes(file.type)) images = [file];
      else throw new Error("Choose a PDF, JPEG, or PNG answer key.");
      const detected: KeyRow[] = [];
      for (const image of images) {
        const data = new FormData(); data.set("file", image, "key.jpg");
        const response = await fetch("/api/answer-key/extract", { method: "POST", body: data });
        const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not read the key.");
        detected.push(...result.items.map((item: Partial<KeyRow>) => ({ ...blank(Number(item.number)), ...item, section: 1, points: 1 })));
      }
      if (!detected.length) throw new Error("No answers were detected. Try a clearer key or enter answers manually.");
      setRows(detected.sort((a, b) => a.number - b.number));
      setReviewStarted(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read the key."); }
    finally { setBusy(false); }
  }
  async function save() { setReviewStarted(true); setBusy(true); setError(""); try { const result = await createExisting(title, rows); if (result?.error) setError(result.error); } catch (err) { if (err && typeof err === "object" && "digest" in err) throw err; setError("Could not save the key. Please try again."); } finally { setBusy(false); } }
  const typeNames: Record<string, string> = { MULTIPLE_CHOICE: "Multiple choice", TRUE_FALSE: "True / false", IDENTIFICATION: "Identification", ESSAY: "Essay" };
  const styleNames: Record<string, string> = { written: "Write letter in blank", circle: "Circle", shade: "Shade", box: "Mark a box", text: "Written text" };
  const uncertain = rows.filter(row => row.uncertain).length;
  const missing = rows.filter(row => row.type !== "ESSAY" && !row.answer.trim()).length;
  return <div className={styles.keySetup}>
    <nav className={styles.keySteps} aria-label="Checking workflow"><span aria-current={!reviewStarted ? "step" : undefined}><b>1</b> Upload key</span><span aria-current={reviewStarted ? "step" : undefined}><b>2</b> Review answers</span><span><b>3</b> Upload student paper</span><span><b>4</b> Check results</span></nav>
    <section className={styles.keyPanel} aria-labelledby="key-upload-heading">
      <div className={styles.keyHeading}><div><p className={styles.keyEyebrow}>01 / SET UP</p><h2 id="key-upload-heading">Add your answer key</h2><p>Upload a key to fill the answers, or enter them below.</p></div></div>
      <label className={styles.keyLabel}>Quiz title<input className={styles.keyInput} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Science quiz" /></label>
      <label className={styles.keyLabel}>Answer key <span className={styles.keyMuted}>(PDF, JPEG, or PNG)</span><input className={styles.keyFile} type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => { const selected = e.target.files?.[0] ?? null; setFile(selected); setPreview(selected ? URL.createObjectURL(selected) : ""); }} /></label>
      <div className={styles.keyUploadActions}><button className={styles.secondary} type="button" onClick={extract} disabled={!file || busy}>{busy ? "Reading…" : "Read answer key"}</button><span>Reading a file replaces the answers below.</span></div>
    </section>
    <section className={styles.keyPanel} aria-labelledby="key-review-heading">
      <div className={styles.keyHeading}><div><p className={styles.keyEyebrow}>02 / REVIEW</p><h2 id="key-review-heading">Review answers</h2><p>Compare each answer with your key. Correct mistakes and fill in any missing answers before continuing.</p></div><span className={styles.keyCount}>{rows.length} {rows.length === 1 ? "question" : "questions"}</span></div>
      {reviewStarted && missing > 0 && <p className={styles.keyMissing} role="status">{missing} {missing === 1 ? "answer needs" : "answers need"} your attention. Check the highlighted fields.</p>}
      {reviewStarted && uncertain > 0 && <p className={styles.keyMissing} role="status">{uncertain} {uncertain === 1 ? "answer needs" : "answers need"} verification. Compare with the key, then confirm or correct each one.</p>}
      <div className={styles.keyReviewLayout}>
      <aside className={styles.keyPreview} aria-label="Original answer key"><div className={styles.previewHead}><strong>Original answer key</strong><span>Compare with the answers on the right.</span></div>{preview ? (file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf") ? <iframe title="Uploaded answer key PDF" src={preview} /> : <img src={preview} alt="Uploaded answer key" />) : <p>Choose a file above to see it here. You can also enter answers manually.</p>}</aside>
      <div className={styles.keyList}>{rows.map((row, i) => <div className={styles.keyItem} key={i}>
        {(i === 0 || rows[i - 1].section !== row.section) && <div className={styles.sectionSettings}><div><strong>Section {row.section}</strong><span>These settings apply to the whole section</span></div><label>How do students answer?<select value={row.style} onChange={e => { const style = e.target.value; setRows(old => old.map(r => r.section === row.section ? { ...r, style } : r)); }}><option value="written">Write letter in blank</option><option value="circle">Circle a choice</option><option value="shade">Shade a choice</option><option value="box">Mark a box</option><option value="text">Write text</option></select></label><label>Directions (optional)<input value={row.directions} onChange={e => { const directions = e.target.value; setRows(old => old.map(r => r.section === row.section ? { ...r, directions } : r)); }} /></label></div>}
        <div className={styles.keySummary}><span className={styles.keyNumber}> {String(row.number).padStart(2, "0")} </span><div className={styles.keyMeta}><strong>Question {row.number}</strong><span>Section {row.section} · {typeNames[row.type] ?? row.type} · {styleNames[row.style] ?? row.style}</span></div><label className={styles.keyAnswer}>Correct answer<input aria-label={`Correct answer for question ${row.number}`} className={reviewStarted && row.type !== "ESSAY" && !row.answer.trim() ? styles.keyNeedsAnswer : undefined} value={row.answer} disabled={row.type === "ESSAY"} onChange={e => update(i, { answer: e.target.value, uncertain: false })} placeholder={row.type === "ESSAY" ? "Teacher graded" : "e.g. B"} /></label><label className={styles.keyPoints}>Points<input aria-label={`Points for question ${row.number}`} type="number" min="0.01" step="0.01" max="9999" value={row.points} onChange={e => update(i, { points: Number(e.target.value) })} /></label></div>
        {row.uncertain && <div className={styles.keyUncertain}><span>AI was unsure. Check the original key.</span><button type="button" onClick={() => update(i, { uncertain: false })}>I checked this answer</button></div>}
        <details className={styles.keyDetails}><summary>Question settings</summary><div className={styles.keyFields}><label>Question #<input type="number" min="1" value={row.number} onChange={e => update(i, { number: Number(e.target.value) })} /></label><label>Section #<input type="number" min="1" value={row.section} onChange={e => { const section = Number(e.target.value); const target = rows.find(r => r.section === section); update(i, { section, ...(target ? { style: target.style, directions: target.directions } : {}) }); }} /></label><label>Type<select value={row.type} onChange={e => update(i, { type: e.target.value })}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True / false</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label><button type="button" className={styles.keyRemove} onClick={() => setRows(old => old.filter((_, n) => n !== i))}>Remove question</button></div></details>
      </div>)}</div>
      </div>
      <button type="button" className={styles.secondary} onClick={() => setRows(old => { const last = old[old.length - 1]; const next = blank(old.length ? Math.max(...old.map(r => r.number)) + 1 : 1); return [...old, last ? { ...next, section: last.section, style: last.style, directions: last.directions } : next]; })}>+ Add question</button>
      <p className={styles.keyNote}>Use consecutive question numbers starting at 1. Use | between alternative accepted answers. Essay points are assigned by the teacher during review.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.keyFinish}><p>Save your key, then choose a student and upload their paper. You can edit correct answers later.</p><button type="button" className={styles.primary} disabled={busy} onClick={save}>{busy ? "Working…" : "Save key"}</button></div>
    </section>
  </div>;
}
