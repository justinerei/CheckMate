"use client";

import { parseDraftPoints } from "@/lib/answer-key-draft";
import { sectionPointsValue } from "@/lib/answer-key-section-points";
import styles from "../../submissions/submissions.module.css";

type Question = { type: string; points: number | string };

export default function SectionPoints({ section, questions, onApply }: { section: number; questions: Question[]; onApply: (points: string) => void }) {
  const objective = questions.filter(question => question.type !== "ESSAY");
  if (!objective.length) return null;
  const value = sectionPointsValue(objective);
  const invalid = value !== null && parseDraftPoints(value) === null;
  const hintId = `section-points-hint-${section}`;
  return <div className={styles.sectionPointControls}>
    <label htmlFor={`section-points-${section}`}>Points per question</label>
    <input id={`section-points-${section}`} type="number" min="0.01" max="9999" step="0.01" value={value ?? ""} placeholder={value === null ? "Mixed" : undefined} aria-invalid={invalid} aria-describedby={hintId} onChange={event => onApply(event.target.value)} />
    <p id={hintId}>{invalid ? "Enter 0.01–9999 points." : value === null ? "Mixed points. Changing this updates all non-essay questions." : questions.some(question => question.type === "ESSAY") ? "Updates non-essay questions." : "Updates all questions in this section."}</p>
  </div>;
}
