"use client";

import { useState } from "react";
import { parseDraftPoints } from "@/lib/answer-key-draft";
import styles from "../../submissions/submissions.module.css";

type Question = { type: string; points: number | string };

export default function SectionPoints({ section, questions, onApply }: { section: number; questions: Question[]; onApply: (points: number) => void }) {
  const objective = questions.filter(question => question.type !== "ESSAY");
  const values = new Set(objective.map(question => parseDraftPoints(question.points)));
  const mixed = values.size > 1;
  const [value, setValue] = useState("");
  const points = parseDraftPoints(value);
  const changed = objective.filter(question => parseDraftPoints(question.points) !== points).length;
  if (!objective.length) return null;
  return <details className={styles.sectionPointControls}>
    <summary>{mixed ? "Mixed points" : `${[...values][0] ?? "Invalid"} points each`} · Set points</summary>
    <div><label htmlFor={`section-points-${section}`}>Points per question</label><input id={`section-points-${section}`} type="number" min="0.01" max="9999" step="0.01" value={value} onChange={event => setValue(event.target.value)} /><button type="button" className={styles.secondary} disabled={points === null || !changed} onClick={() => { if (points !== null && (!mixed || window.confirm(`${changed} of ${objective.length} questions will change to ${points} points. Apply to this section?`))) { onApply(points); setValue(""); } }}>Apply to section</button></div>
    <p>{mixed ? "Questions have different points." : `Current: ${[...values][0] ?? "invalid"} points each.`} Essays are not changed.</p>
  </details>;
}
