"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { defaultEssayRubric } from "@/lib/rubric";
import { parseQuestion } from "@/lib/question-input";
import type { SuggestedQuestion } from "@/lib/suggested-questions";
import styles from "./module-workshop.module.css";

type Slot = { id: string; type: string; number: number; points: string };
type Criterion = { title: string; description: string; points: string };
export default function SuggestionCard({ quizId, slot, suggestion, busy, onSaved, onRegenerate }: { quizId: string; slot: Slot; suggestion: SuggestedQuestion; busy: boolean; onSaved: (id: string) => void; onRegenerate: (id: string) => void }) {
  const router = useRouter();
  const [text, setText] = useState(suggestion.text);
  const [choices, setChoices] = useState(suggestion.choices);
  const [answer, setAnswer] = useState(suggestion.answer);
  const [points, setPoints] = useState(slot.points);
  const [criteria, setCriteria] = useState<Criterion[]>(() => Number(slot.points) >= 0.03 ? defaultEssayRubric(Number(slot.points)).map(c => ({ title: c.title, description: c.description, points: String(c.maxPoints) })) : [{ title: "Response", description: "Quality of the response.", points: slot.points }]);
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
    <div className={styles.suggestionHead}><div><span className={styles.kicker}>QUESTION {slot.number} · SUGGESTION</span><h4>Review and edit</h4></div><button type="button" className={styles.textButton} disabled={busy || saving} onClick={() => onRegenerate(slot.id)}>↻ Regenerate</button></div>
    <div className={styles.source}><p>Suggested source: {suggestion.sourceName} · page {suggestion.sourcePage}. Check the source and answer before saving.</p><button type="button" className={styles.textButton} aria-expanded={sourceOpen} onClick={toggleSource}>{sourceOpen ? "Hide source excerpt" : "View source excerpt"}</button>{sourceOpen && <div className={styles.sourceExcerpt}>{sourceLoading ? "Loading…" : sourceError || sourceText}</div>}</div>
    <input type="hidden" name="type" value={slot.type} /><input type="hidden" name="moduleId" value={suggestion.sourceModuleId} /><input type="hidden" name="sourcePage" value={suggestion.sourcePage} />
    <label>Question<textarea name="text" value={text} onChange={e => setText(e.target.value)} maxLength={2000} rows={3} required /></label>
    {slot.type === "MULTIPLE_CHOICE" && <><div className={styles.choices}>{["A","B","C","D"].map((label, index) => <label key={label}>Choice {label}<input name={`choice${label}`} value={choices[index] ?? ""} onChange={e => setChoices(previous => previous.map((choice, i) => i === index ? e.target.value : choice))} maxLength={500} required /></label>)}</div><label>Correct answer<select name="answer" value={answer} onChange={e => setAnswer(e.target.value)} required><option value="">Choose an answer</option>{["A","B","C","D"].map(label => <option key={label}>{label}</option>)}</select></label></>}
    {slot.type === "TRUE_FALSE" && <label>Correct answer<select name="answer" value={answer} onChange={e => setAnswer(e.target.value)} required><option value="">Choose an answer</option><option value="T">True</option><option value="F">False</option></select></label>}
    {slot.type === "IDENTIFICATION" && <label>Accepted answers<input name="answer" value={answer} onChange={e => setAnswer(e.target.value)} maxLength={1000} placeholder="Separate alternatives with commas" required /></label>}
    <label>Points<input name="points" type="number" min="0.01" max="9999" step="0.01" value={points} onChange={e => setPoints(e.target.value)} required /></label>
    {slot.type === "ESSAY" && <><label>Answer lines<input type="number" name="lines" min="1" max="30" defaultValue="7" required /></label><div className={styles.rubric}><strong>Essay rubric</strong><p>Edit the suggested criteria. Their points must add up to the question points.</p>{criteria.map((criterion, index) => <fieldset key={index}><legend>Criterion {index + 1}</legend><label>Title<input value={criterion.title} onChange={e => setCriteria(old => old.map((c,i) => i === index ? { ...c, title: e.target.value } : c))} maxLength={120} required /></label><label>Description<input value={criterion.description} onChange={e => setCriteria(old => old.map((c,i) => i === index ? { ...c, description: e.target.value } : c))} maxLength={500} required /></label><label>Points<input type="number" min="0.01" max="9999" step="0.01" value={criterion.points} onChange={e => setCriteria(old => old.map((c,i) => i === index ? { ...c, points: e.target.value } : c))} required /></label>{criteria.length > 1 && <button className={styles.textButton} type="button" onClick={() => setCriteria(old => old.filter((_, i) => i !== index))}>Remove criterion</button>}</fieldset>)}<button className={styles.textButton} type="button" onClick={() => setCriteria(old => [...old, { title: "", description: "", points: "" }])}>＋ Add criterion</button><input type="hidden" name="rubric" value={criteria.map(c => `${c.title.trim()} | ${c.description.trim()} | ${c.points.trim()}`).join("\n")} /></div></>}
    {error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.secondary} type="submit" disabled={busy || saving}>{saving ? "Saving…" : "Save question"}</button>
  </form>;
}
