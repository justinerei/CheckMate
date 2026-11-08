"use client";
import { useState } from "react";
import styles from "./quiz-editor.module.css";

export default function QuestionForm({ action, defaultPoints }: { action: (data: FormData) => void | Promise<void>; defaultPoints: string }) {
  const [type, setType] = useState("MULTIPLE_CHOICE");
  return <form action={action} className={styles.form}>
    <h3>Add a question</h3><label>Question type<select name="type" value={type} onChange={event => setType(event.target.value)}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True or False</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label>
    <label>Question<textarea name="text" required maxLength={2000} rows={3} /></label>
    <label>Points<input name="points" type="number" min="0.01" max="9999" step="0.01" defaultValue={defaultPoints} required /></label>
    {type === "MULTIPLE_CHOICE" && <><div className={styles.choices}>{["A", "B", "C", "D"].map((label, index) => <label key={label}>Choice {label}<input name={`choice${label}`} required={index < 2} /></label>)}</div><label>Correct answer<select name="answer" required defaultValue=""><option value="" disabled>Select a letter</option>{["A", "B", "C", "D"].map(label => <option key={label}>{label}</option>)}</select></label></>}
    {type === "TRUE_FALSE" && <label>Correct answer<select name="answer" required defaultValue=""><option value="" disabled>Select an answer</option><option value="T">True (T)</option><option value="F">False (F)</option></select></label>}
    {type === "IDENTIFICATION" && <label>Accepted answers<input name="answer" required placeholder="Separate accepted answers with commas" /><small>Example: Mars, the Red Planet</small></label>}
    {type === "ESSAY" && <><label>Answer lines<input name="lines" type="number" defaultValue="7" min="1" max="30" required /></label><label>Rubric criteria<textarea name="rubric" rows={4} required placeholder={"Accuracy | Correct facts | 5\nExplanation | Clear reasoning | 5"} /><small>One criterion per line: title | description | points. The points must add up to the question total.</small></label></>}
    <label className={styles.check}><input type="checkbox" name="besideNext" /> Place beside next question in print layout</label><button className={styles.primary} type="submit">Add question</button>
  </form>;
}
