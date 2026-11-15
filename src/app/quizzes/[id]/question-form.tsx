"use client";
import { useState } from "react";
import { PendingSubmit } from "@/app/pending-screen";
import { parseQuestion } from "@/lib/question-input";
import { defaultEssayRubric } from "@/lib/rubric";
import styles from "./quiz-editor.module.css";

type Initial = { type: string; text: string; points: string; choices: { label: string; text: string }[]; answers: string[]; rubric: string; lines: number; besideNext: boolean };
type Criterion = { id: number; title: string; description: string; points: string };
function Submit({ editing }: { editing: boolean }) {
  return <PendingSubmit className={styles.primary}>{editing ? "Save changes" : "Save question"}</PendingSubmit>;
}

export default function QuestionForm({ action, defaultPoints, initial, cancelHref, sharedRubric }: { sharedRubric?: { rubric: string; points: string }; action: (data: FormData) => void | Promise<void>; defaultPoints: string; initial?: Initial; cancelHref?: string }) {
  const [type, setType] = useState(initial?.type ?? "MULTIPLE_CHOICE");
  const [error, setError] = useState("");
  const [points, setPoints] = useState(initial?.points ?? defaultPoints);
  const [criteria, setCriteria] = useState<Criterion[]>(() => initial?.rubric ? initial.rubric.split("\n").map((line, id) => { const [title, description, points] = line.split("|").map(value => value.trim()); return { id, title, description, points }; }) : initial?.type === "ESSAY" ? defaultEssayRubric(Number(initial.points)).map((c, id) => ({ id, title: c.title, description: c.description, points: String(c.maxPoints) })) : [{ id: 0, title: "", description: "", points: "" }]);
  const total = Math.round(criteria.reduce((sum, c) => sum + (Number(c.points) || 0), 0) * 100) / 100;
  const rubric = criteria.map(c => `${c.title.trim()} | ${c.description.trim()} | ${c.points.trim()}`).join("\n");
  function update(id: number, key: "title" | "description" | "points", value: string) { setCriteria(previous => previous.map(c => c.id === id ? { ...c, [key]: value } : c)); }
  return <form action={action} className={styles.form} onSubmit={event => {
    const data = new FormData(event.currentTarget);
    if (criteria.some(c => c.title.includes("|") || c.description.includes("|")) && type === "ESSAY") { event.preventDefault(); setError("Remove the | character from the rubric fields."); return; }
    if (!parseQuestion(data)) { event.preventDefault(); setError(type === "ESSAY" ? "Complete each criterion and make sure their points add up to the question points." : type === "MULTIPLE_CHOICE" ? "Enter at least two choices and select a correct answer with text." : "Enter a question, valid points, and an accepted answer."); return; }
    setError("");
  }}>
    <h3>{initial ? "Edit question" : "New question"}</h3>
    <label>Question type<select name="type" value={type} onChange={event => { const next = event.target.value; if (next === "ESSAY" && criteria.length === 1 && !criteria[0].title && !criteria[0].description && !criteria[0].points) setCriteria(defaultEssayRubric(Number(points)).map((c, id) => ({ id, title: c.title, description: c.description, points: String(c.maxPoints) }))); setType(next); setError(""); }}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True or False</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label>
    <label>Question<textarea name="text" defaultValue={initial?.text} required maxLength={2000} rows={3} /></label>
    <label>Points<input name="points" type="number" min="0.01" max="9999" step="0.01" value={type === "ESSAY" && sharedRubric ? sharedRubric.points : points} onChange={event => setPoints(event.target.value)} readOnly={type === "ESSAY" && !!sharedRubric} required />{type === "ESSAY" && sharedRubric && <small>Set by the shared section rubric.</small>}</label>
    {type === "MULTIPLE_CHOICE" && <><div className={styles.choices}>{["A", "B", "C", "D"].map((label, index) => <label key={label}>Choice {label}{index >= 2 && " (optional)"}<input name={`choice${label}`} defaultValue={initial?.choices.find(c => c.label === label)?.text} required={index < 2} /></label>)}</div><label>Correct answer<select name="answer" required defaultValue={initial?.type === type ? initial.answers[0] : ""}><option value="" disabled>Select a letter</option>{["A", "B", "C", "D"].map(label => <option key={label}>{label}</option>)}</select></label></>}
    {type === "TRUE_FALSE" && <label>Correct answer<select name="answer" required defaultValue={initial?.type === type ? initial.answers[0] : ""}><option value="" disabled>Select an answer</option><option value="T">True (T)</option><option value="F">False (F)</option></select></label>}
    {type === "IDENTIFICATION" && <label>Accepted answers<input name="answer" defaultValue={initial?.type === type ? initial.answers.join(", ") : ""} required placeholder="Separate accepted answers with commas" /><small>Example: Mars, the Red Planet</small></label>}
    {type === "ESSAY" && sharedRubric && <><label>Answer lines<input name="lines" type="number" defaultValue={initial?.lines ?? 7} min="1" max="30" required /></label><p>Uses the shared essay rubric. Edit the section to change its criteria.</p><input type="hidden" name="rubric" value={sharedRubric.rubric} /></>}\n    {type === "ESSAY" && !sharedRubric && <><label>Answer lines<input name="lines" type="number" defaultValue={initial?.lines ?? 7} min="1" max="30" required /></label><div className={styles.rubric}><div><h4>Rubric criteria</h4><small>Review and edit the suggested criteria. Their points must add up to the question points.</small><p className={styles.rubricProgress} role="status">Criteria total: {total} / {points || "0"} points</p></div>{criteria.map((criterion, index) => <fieldset key={criterion.id}><legend>Criterion {index + 1}</legend><label>Title<input value={criterion.title} onChange={e => update(criterion.id, "title", e.target.value)} required maxLength={120} /></label><label>Description<input value={criterion.description} onChange={e => update(criterion.id, "description", e.target.value)} required maxLength={500} /></label><label>Points<input type="number" value={criterion.points} onChange={e => update(criterion.id, "points", e.target.value)} min="0.01" max="9999" step="0.01" required /></label>{criteria.length > 1 && <button type="button" className={styles.textButton} onClick={() => setCriteria(previous => previous.filter(c => c.id !== criterion.id))}>Remove criterion</button>}</fieldset>)}<button type="button" className={styles.secondaryButton} onClick={() => setCriteria(previous => [...previous, { id: Math.max(...previous.map(c => c.id)) + 1, title: "", description: "", points: "" }])}>＋ Add criterion</button><input type="hidden" name="rubric" value={rubric} /></div></>}
    <label className={styles.check}><input type="checkbox" name="besideNext" defaultChecked={initial?.besideNext} /> Place beside the next question on paper</label>
    {error && <p className={styles.fieldError} role="alert">{error}</p>}
    <div className={styles.formActions}><Submit editing={Boolean(initial)} />{cancelHref && <a href={cancelHref}>Cancel</a>}</div>
  </form>;
}
