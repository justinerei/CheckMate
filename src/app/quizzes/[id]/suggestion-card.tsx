"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { DraftEdit } from "@/lib/suggestion-drafts";
import { parseQuestion } from "@/lib/question-input";
import type { SuggestedQuestion } from "@/lib/suggested-questions";
import styles from "./module-workshop.module.css";

type Slot = { id: string; type: string; number: number; points: string };
export default function SuggestionCard({ quizId, slot, suggestion, edit, busy, onEdit, onDiscard, onSaved, onRegenerate }: { quizId: string; slot: Slot; suggestion: SuggestedQuestion; edit: DraftEdit; busy: boolean; onEdit: (patch: Partial<DraftEdit>) => void; onDiscard: (id: string) => void; onSaved: (id: string) => void; onRegenerate: (id: string) => void }) {
  const router = useRouter();
  const { text, choices, answer, points, criteria, lines } = edit;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [sourceLoading, setSourceLoading] = useState(false);
  async function toggleSource() {
    if (sourceOpen) { setSourceOpen(false); return; }
    setSourceOpen(true);
    if (sourceText) return;
    setSourceLoading(true); setSourceError("");
    try {
      const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/modules/${encodeURIComponent(suggestion.sourceModuleId)}?page=${suggestion.sourcePage}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load source.");
      setSourceText(result.text);
    } catch (err) { setSourceError(err instanceof Error ? err.message : "Could not load source."); }
    finally { setSourceLoading(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (!parseQuestion(form)) { setError("Complete the question and answer. For an essay, rubric points must add up to the question points."); return; }
    setSaving(true); setError("");
    try { const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/questions/${encodeURIComponent(slot.id)}/accept`, { method: "POST", body: form }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save question."); onSaved(slot.id); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save question."); } finally { setSaving(false); }
  }
  return <form className={styles.suggestion} onSubmit={save}>
    <div className={styles.suggestionHead}><div><span className={styles.kicker}>QUESTION {slot.number} · SUGGESTION</span><h4>Review and edit</h4></div><button type="button" className={styles.textButton} disabled={busy || saving} onClick={() => onRegenerate(slot.id)}>↻ Regenerate</button><button type="button" className={styles.textButton} disabled={busy || saving} onClick={() => onDiscard(slot.id)}>Discard draft</button></div>
    <div className={styles.source}><p>Suggested source: {suggestion.sourceName} · page {suggestion.sourcePage}. Check the source and answer before saving.</p><button type="button" className={styles.textButton} aria-expanded={sourceOpen} onClick={toggleSource}>{sourceOpen ? "Hide source excerpt" : "View source excerpt"}</button>{sourceOpen && <div className={styles.sourceExcerpt}>{sourceLoading ? "Loading…" : sourceError || sourceText}</div>}</div>
    <input type="hidden" name="type" value={slot.type} /><input type="hidden" name="moduleId" value={suggestion.sourceModuleId} /><input type="hidden" name="sourcePage" value={suggestion.sourcePage} />
    <label>Question<textarea name="text" value={text} onChange={e => onEdit({ text: e.target.value })} maxLength={2000} rows={3} required /></label>
    {slot.type === "MULTIPLE_CHOICE" && <><div className={styles.choices}>{["A","B","C","D"].map((label, index) => <label key={label}>Choice {label}<input name={`choice${label}`} value={choices[index] ?? ""} onChange={e => onEdit({ choices: choices.map((choice, i) => i === index ? e.target.value : choice) })} maxLength={500} required /></label>)}</div><label>Correct answer<select name="answer" value={answer} onChange={e => onEdit({ answer: e.target.value })} required><option value="">Choose an answer</option>{["A","B","C","D"].map(label => <option key={label}>{label}</option>)}</select></label></>}
    {slot.type === "TRUE_FALSE" && <label>Correct answer<select name="answer" value={answer} onChange={e => onEdit({ answer: e.target.value })} required><option value="">Choose an answer</option><option value="T">True</option><option value="F">False</option></select></label>}
    {slot.type === "IDENTIFICATION" && <label>Accepted answers<input name="answer" value={answer} onChange={e => onEdit({ answer: e.target.value })} maxLength={1000} placeholder="Separate alternatives with commas" required /></label>}
    <label>Points<input name="points" type="number" min="0.01" max="9999" step="0.01" value={points} onChange={e => onEdit({ points: e.target.value })} required /></label>
    {slot.type === "ESSAY" && <><label>Answer lines<input type="number" name="lines" min="1" max="30" value={lines} onChange={e => onEdit({ lines: e.target.value })} required /></label><div className={styles.rubric}><strong>Essay rubric</strong><p>Edit the suggested criteria. Their points must add up to the question points.</p>{criteria.map((criterion, index) => <fieldset key={index}><legend>Criterion {index + 1}</legend><label>Title<input value={criterion.title} onChange={e => onEdit({ criteria: criteria.map((c,i) => i === index ? { ...c, title: e.target.value } : c) })} maxLength={120} required /></label><label>Description<input value={criterion.description} onChange={e => onEdit({ criteria: criteria.map((c,i) => i === index ? { ...c, description: e.target.value } : c) })} maxLength={500} required /></label><label>Points<input type="number" min="0.01" max="9999" step="0.01" value={criterion.points} onChange={e => onEdit({ criteria: criteria.map((c,i) => i === index ? { ...c, points: e.target.value } : c) })} required /></label>{criteria.length > 1 && <button className={styles.textButton} type="button" onClick={() => onEdit({ criteria: criteria.filter((_, i) => i !== index) })}>Remove criterion</button>}</fieldset>)}<button className={styles.textButton} type="button" disabled={criteria.length >= 20} onClick={() => onEdit({ criteria: [...criteria, { title: "", description: "", points: "" }] })}>＋ Add criterion</button><input type="hidden" name="rubric" value={criteria.map(c => `${c.title.trim()} | ${c.description.trim()} | ${c.points.trim()}`).join("\n")} /></div></>}
    {error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.secondary} type="submit" disabled={busy || saving}>{saving ? "Saving…" : "Save question"}</button>
  </form>;
}
