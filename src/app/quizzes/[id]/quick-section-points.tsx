"use client";
import { useState } from "react";
import { countChangedSectionPoints } from "@/lib/section-points";
import SubmitButton from "./submit-button";
import styles from "./quiz-editor.module.css";

type QuestionPoints = { type: string; points: string };
export default function QuickSectionPoints({ sectionId, defaultPoints, questions, action, error }: { sectionId: string; defaultPoints: string; questions: QuestionPoints[]; action: (form: FormData) => Promise<void>; error: boolean }) {
  const [points, setPoints] = useState(defaultPoints);
  const objective = questions.filter(question => question.type !== "ESSAY");
  const changed = countChangedSectionPoints(objective, Number(points));
  const mixed = new Set(objective.map(question => Number(question.points))).size > 1;
  return <form className={styles.quickPoints} action={action} onSubmit={event => {
    if (mixed && changed > 0 && !window.confirm(`${changed} of ${objective.length} questions will change to ${points} points. Apply to this section?`)) event.preventDefault();
  }}>
    <label htmlFor={`points-${sectionId}`}>{questions.some(question => question.type === "ESSAY") ? "Points per non-essay question" : "Points per question"}</label>
    <div><input id={`points-${sectionId}`} name="points" type="number" min="0.01" max="9999" step="0.01" value={points} onChange={event => setPoints(event.target.value)} required /><SubmitButton>Apply to section</SubmitButton></div>
    <small>{mixed ? `Questions have different points. ${changed} of ${objective.length} would change.` : `Applies to all ${questions.some(question => question.type === "ESSAY") ? "non-essay " : ""}questions in this section.`}</small>
    {error && <p className={styles.fieldError} role="alert">Enter points from 0.01 to 9999, with up to two decimal places.</p>}
  </form>;
}
