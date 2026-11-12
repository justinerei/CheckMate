"use client";
import { useState } from "react";
import type { KeyRow } from "./actions";
import { validateRubric } from "@/lib/rubric";
import styles from "../../submissions/submissions.module.css";

export default function EssayRubric({ row, onChange }: { row: KeyRow; onChange: (patch: Partial<KeyRow>) => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [image, setImage] = useState<File | null>(null);
  const criteria = row.rubric ?? [];
  const edit = (index: number, patch: Partial<(typeof criteria)[number]>) => onChange({ rubric: criteria.map((c, i) => i === index ? { ...c, ...patch } : c), rubricConfirmed: false });
  async function suggest() {
    if (criteria.length && !window.confirm("Replace the current rubric with an AI draft?")) return;
    const data = new FormData(); data.set("question", row.questionText ?? ""); data.set("number", String(row.number)); data.set("points", String(row.points)); if (image) data.set("image", image);
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/rubric/suggest", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) { setMessage(result.error); return; } onChange({ rubric: result.criteria, rubricConfirmed: false }); setMessage("Draft ready. Review and confirm every criterion."); }
    catch { setMessage("Could not suggest a rubric. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <div className={styles.rubricBox}><h4>Essay rubric</h4><p>Set criteria totalling {row.points} points. You can write your own or ask AI for a draft.</p><label>Essay question (for context)<textarea className={styles.keyInput} value={row.questionText ?? ""} maxLength={4000} onChange={e => onChange({ questionText: e.target.value, rubricConfirmed: false })} /></label><label>Or choose a photo of the quiz page for AI<input type="file" accept="image/jpeg,image/png" onChange={e => setImage(e.target.files?.[0] ?? null)} /></label><button type="button" className={styles.secondary} disabled={busy} onClick={suggest}>{busy ? "Creating draft…" : "Suggest rubric with AI"}</button><p className={styles.help}>When selected, the question or quiz page is sent to Groq.</p>{criteria.map((c, i) => <div className={styles.rubricCriterion} key={i}><label>Criterion<input className={styles.keyInput} value={c.title} maxLength={120} onChange={e => edit(i, { title: e.target.value })} /></label><label>Description<textarea className={styles.keyInput} value={c.description} maxLength={1000} onChange={e => edit(i, { description: e.target.value })} /></label><label>Maximum points<input className={styles.keyInput} type="number" min="0.01" step="0.01" value={c.maxPoints} onChange={e => edit(i, { maxPoints: Number(e.target.value) })} /></label><button type="button" className={styles.secondary} onClick={() => onChange({ rubric: criteria.filter((_, n) => n !== i), rubricConfirmed: false })}>Remove criterion</button></div>)}<button type="button" className={styles.secondary} onClick={() => onChange({ rubric: [...criteria, { title: "", description: "", maxPoints: 1 }], rubricConfirmed: false })}>+ Add criterion</button><label className={styles.check}><input type="checkbox" checked={!!row.rubricConfirmed} disabled={!validateRubric(criteria, row.points)} onChange={e => onChange({ rubricConfirmed: e.target.checked })} /> I reviewed this rubric and confirm its criteria and points.</label>{message && <p role="status">{message}</p>}</div>;
}
