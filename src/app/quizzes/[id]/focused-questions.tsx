"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import styles from "./quiz-editor.module.css";

function subscribeToHash(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }

type Section = { id: string; title: string; questions: { id: string; number: number; complete: boolean }[] };
export default function FocusedQuestions({ sections, initialId, children }: { sections: Section[]; initialId?: string; children: ReactNode[] }) {
  const questions = sections.flatMap(section => section.questions);
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
  const hashId = hash.startsWith("#question-") ? hash.slice(10) : "";
  const active = questions.some(question => question.id === hashId) ? hashId : questions.some(question => question.id === initialId) ? initialId : questions[0]?.id;
  let panelIndex = 0;
  return <div className={styles.focusedLayout}>
    <nav className={styles.questionNav} aria-label="Questions">
      <h2>Questions</h2><p>{questions.filter(question => question.complete).length} of {questions.length} filled in</p>
      {sections.map(section => <div key={section.id} className={styles.navGroup}><h3>{section.title}</h3>{section.questions.map(question => <button key={question.id} type="button" className={active === question.id ? styles.navActive : undefined} aria-current={active === question.id ? "step" : undefined} onClick={() => { window.location.hash = `question-${question.id}`; }}><span>Question {question.number}</span><small>{active === question.id ? "Editing" : question.complete ? "Done" : "Empty"}</small></button>)}</div>)}
    </nav>
    <div className={styles.focusedPanels}>{sections.flatMap(section => section.questions.map(question => { const panel = children[panelIndex++]; return <div key={question.id} hidden={active !== question.id}>{panel}</div>; }))}</div>
  </div>;
}
