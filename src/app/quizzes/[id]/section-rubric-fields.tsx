"use client";
import { useState } from "react";
import styles from "./quiz-editor.module.css";

type Criterion = { title: string; description: string; points: string };
export default function SectionRubricFields({ initial, differs }: { initial: Criterion[]; differs: boolean }) {
  const [criteria, setCriteria] = useState(initial);
  function update(index: number, field: keyof Criterion, value: string) { setCriteria(old => old.map((criterion, i) => i === index ? { ...criterion, [field]: value } : criterion)); }
  return <div className={styles.rubric}><div><h4>Shared essay rubric</h4><small>Applies to every essay in this section. Each essay is scored individually using these points.</small>{differs && <label className={styles.check}><input type="checkbox" name="replaceDifferentRubrics" required /> Existing essay rubrics differ. Replace them with this shared rubric and its points.</label>}</div>{criteria.map((criterion, i) => <fieldset key={i}><legend>Criterion {i + 1}</legend><label>Title<input value={criterion.title} onChange={e => update(i, "title", e.target.value)} required maxLength={120} /></label><label>Description<input value={criterion.description} onChange={e => update(i, "description", e.target.value)} required maxLength={500} /></label><label>Points<input type="number" value={criterion.points} onChange={e => update(i, "points", e.target.value)} min="0.01" max="9999" step="0.01" required /></label>{criteria.length > 1 && <button type="button" className={styles.textButton} onClick={() => setCriteria(old => old.filter((_, index) => index !== i))}>Remove criterion</button>}</fieldset>)}<button type="button" className={styles.secondaryButton} disabled={criteria.length >= 20} onClick={() => setCriteria(old => [...old, { title: "", description: "", points: "" }])}>＋ Add criterion</button><input type="hidden" name="sharedRubric" value={JSON.stringify(criteria)} /></div>;
}
