"use client";
import { useEffect, useRef, useState } from "react";
import { instructionTemplates } from "@/lib/instruction-templates";
import styles from "./quiz-editor.module.css";

export default function NewSectionFields({ questionCount }: { questionCount: number }) {
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [instructions, setInstructions] = useState(instructionTemplates.MULTIPLE_CHOICE);
  const field = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const form = field.current?.form;
    const reset = () => { setType("MULTIPLE_CHOICE"); setInstructions(instructionTemplates.MULTIPLE_CHOICE); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  function changeType(next: string) {
    setInstructions(current => current === instructionTemplates[type] ? instructionTemplates[next] : current);
    setType(next);
  }

  return <>
    <label>Question type<select ref={field} name="questionType" value={type} onChange={event => changeType(event.target.value)}><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True or false</option><option value="IDENTIFICATION">Identification</option><option value="ESSAY">Essay</option></select></label>
    <label>Number of questions<input type="number" name="questionCount" min="1" max={Math.max(1, 200 - questionCount)} step="1" defaultValue="1" required /><small>{questionCount} questions currently · Adding this section increases the quiz total. Up to 200 questions in the outline.</small></label>
    <label>Instructions <span className={styles.optional}>Suggested · editable</span><textarea name="instructions" rows={3} maxLength={2000} value={instructions} onChange={event => setInstructions(event.target.value)} /><small>Edit or clear the suggestion as needed. To apply a no-erasure rule during checking, add “No erasures.” as a separate sentence.</small></label>
    {instructions !== instructionTemplates[type] && <button type="button" className={styles.secondaryButton} onClick={() => { if (!instructions.trim() || window.confirm("Replace your current instructions with the suggestion?")) setInstructions(instructionTemplates[type]); }}>Use suggested instructions</button>}
  </>;
}
