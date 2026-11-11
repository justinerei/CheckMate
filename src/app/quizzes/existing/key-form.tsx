"use client";
import { useState } from "react";
import { createExisting, type KeyRow } from "./actions";
import styles from "../../submissions/submissions.module.css";

const blank = (number: number): KeyRow => ({ number, section: 1, answer: "", type: "MULTIPLE_CHOICE", style: "written", points: 1, directions: "" });
export default function KeyForm() {
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<KeyRow[]>([blank(1)]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
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
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read the key."); }
    finally { setBusy(false); }
  }
  async function save() { setBusy(true); setError(""); try { const result = await createExisting(title, rows); if (result?.error) setError(result.error); } catch (err) { if (err && typeof err === "object" && "digest" in err) throw err; setError("Could not save the key. Please try again."); } finally { setBusy(false); } }
  return <div className={styles.confirm}><label>Quiz title<input className={styles.keyInput} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} /></label><label>Answer key (PDF, JPEG, or PNG)<input className={styles.keyInput} type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label><button className={styles.secondary} type="button" onClick={extract} disabled={!file || busy}>{busy ? "Working…" : "Read answer key"}</button><p>Reading replaces the answers below. Check every item, add missing questions, and correct mistakes. Use | between alternative accepted answers. For essay questions, the teacher assigns points during review.</p><h2>Review answer key</h2>{rows.map((row, i) => <div className={styles.keyRow} key={i}><label>Question #<input type="number" min="1" value={row.number} onChange={e => update(i, { number: Number(e.target.value) })} /></label><label>Section #<input type="number" min="1" value={row.section} onChange={e => update(i, { section: Number(e.target.value) })} /></label><label>Type<select value={row.type} onChange={e => update(i, { type: e.target.value })}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True / false</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label><label>Student answer style<select value={row.style} onChange={e => { const style = e.target.value; setRows(old => old.map(r => r.section === row.section ? { ...r, style } : r)); }}><option value="written">Write letter in blank</option><option value="circle">Circle</option><option value="shade">Shade</option><option value="box">Mark a box</option><option value="text">Written text</option></select></label><label>Correct answer<input value={row.answer} disabled={row.type === "ESSAY"} onChange={e => update(i, { answer: e.target.value })} placeholder={row.type === "ESSAY" ? "Teacher graded" : "e.g. B"} /></label><label>Points<input type="number" min="0.01" step="0.01" max="9999" value={row.points} onChange={e => update(i, { points: Number(e.target.value) })} /></label><label className={styles.keyWide}>Directions (optional)<input value={row.directions} onChange={e => update(i, { directions: e.target.value })} /></label><button type="button" className={styles.secondary} onClick={() => setRows(old => old.filter((_, n) => n !== i))}>Remove</button></div>)}<button type="button" className={styles.secondary} onClick={() => setRows(old => [...old, blank(old.length ? Math.max(...old.map(r => r.number)) + 1 : 1)])}>Add question</button><p>Use consecutive question numbers starting at 1. Questions in the same section must use the same answer style.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} disabled={busy} onClick={save}>{busy ? "Working…" : "Confirm key and create checking task"}</button></div>;
}

