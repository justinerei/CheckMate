"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useActionState, useState } from "react";
import { moveItem } from "@/lib/reorder";
import ReorderControls from "./reorder-controls";
import { saveSectionOrder } from "./reorder-actions";
import styles from "./section-order.module.css";

type Section = { id: string; title: string; count: number };
export default function SectionOrder({ quizId, initial, continuous }: { quizId: string; initial: Section[]; continuous: boolean }) {
  const [sections, setSections] = useState(initial);
  const [announcement, setAnnouncement] = useState("");
  const [state, action, pending] = useActionState(saveSectionOrder.bind(null, quizId), { error: "" });
  const changed = sections.some((section, index) => section.id !== initial[index].id);
  function moveSection(id: string, destination: string | number) {
    const from = sections.findIndex(section => section.id === id);
    const to = typeof destination === "number" ? from + destination : sections.findIndex(section => section.id === destination);
    if (from < 0 || to < 0 || to >= sections.length || from === to) return;
    setSections(moveItem(sections, from, to));
    setAnnouncement(`${sections[from].title} moved to position ${to + 1} of ${sections.length}.`);
  }
  return <details data-accordion className={styles.panel}><summary>Reorder sections <span>Move a section with all its questions and answers</span></summary><form action={action} className={styles.form}><PendingScreen pending={pending} message="Saving section order…" />
    <p>Hold the handle to move a section or use the arrows. Save any open question edits first; saving this order reloads the editor.</p>
    <div className={styles.list} data-reorder-list>{sections.map((section, index) => { const start = sections.slice(0, index).reduce((sum, previous) => sum + previous.count, 0) + 1; return <div className={styles.row} key={section.id} data-reorder-id={section.id}><span className={styles.index}>{String(index + 1).padStart(2, "0")}</span><div className={styles.name}><strong>{section.title}</strong><small>{section.count} {section.count === 1 ? "question" : "questions"}{continuous && section.count ? ` · Questions ${start}–${start + section.count - 1}` : ""}</small></div><ReorderControls id={section.id} label={section.title} first={index === 0} last={index === sections.length - 1} disabled={pending} onMove={moveSection} /></div>; })}</div>
    <p className={styles.srOnly} aria-live="polite">{announcement}</p><input type="hidden" name="order" value={JSON.stringify(sections.map(section => section.id))} /><input type="hidden" name="expected" value={JSON.stringify(initial.map(section => section.id))} />{state.error && <p className={styles.error} role="alert">{state.error}</p>}<div className={styles.actions}><button type="submit" disabled={!changed || pending}>{pending ? "Saving…" : "Save section order"}</button>{changed && <button type="button" disabled={pending} onClick={() => setSections(initial)}>Undo changes</button>}</div>
  </form></details>;
}
