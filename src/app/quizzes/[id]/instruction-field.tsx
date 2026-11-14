"use client";
import { useState } from "react";
import { instructionTemplates } from "@/lib/instruction-templates";
import styles from "./quiz-editor.module.css";

export default function InstructionField({ initial, kind }: { initial: string; kind: string }) {
  const [value, setValue] = useState(initial);
  const suggestion = instructionTemplates[kind];
  return <div className={styles.instructionField}><label>{kind === "general" ? "General instructions" : "Instructions"}<textarea name={kind === "general" ? "generalInstructions" : "instructions"} rows={3} maxLength={2000} value={value} onChange={event => setValue(event.target.value)} /></label>{suggestion && <button type="button" className={styles.secondaryButton} onClick={() => { if (!value.trim() || window.confirm("Replace your current instructions with this suggestion?")) setValue(suggestion); }}>Suggest instructions</button>}<small>{kind === "general" ? "Optional. Shown at the top of the printed quiz. For rules used in checking, add them to the relevant section instructions." : "Review and edit before saving. To apply a no-erasure rule during checking, add ‘No erasures.’ as a separate sentence."}</small></div>;
}
