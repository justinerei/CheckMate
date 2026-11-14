"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { saveOutline } from "./actions";
import ReorderControls from "../reorder-controls";
import { moveItem } from "@/lib/reorder";
import { parseQuizOutline, type OutlineSection, type OutlineType } from "@/lib/quiz-outline";
import styles from "./outline.module.css";

const options: { value: OutlineType; label: string }[] = [ { value: "MULTIPLE_CHOICE", label: "Multiple choice" }, { value: "IDENTIFICATION", label: "Identification" }, { value: "TRUE_FALSE", label: "True or false" }, { value: "ESSAY", label: "Essay" } ];
export default function OutlineForm({ id, initial, editing = false }: { id: string; initial: OutlineSection[]; editing?: boolean }) {
  const starting = initial.length ? initial : [{ type: "MULTIPLE_CHOICE" as const, count: 10 }];
  const [total, setTotal] = useState(String(starting.reduce((sum, row) => sum + row.count, 0)));
  const [sections, setSections] = useState<(OutlineSection & { id: string })[]>(() => starting.map((section, index) => ({ ...section, id: `section-${index}` })));
  const [announcement, setAnnouncement] = useState("");
  function moveSection(id: string, destination: string | number) {
    const from = sections.findIndex(section => section.id === id);
    const to = typeof destination === "number" ? from + destination : sections.findIndex(section => section.id === destination);
    if (from < 0 || to < 0 || to >= sections.length || from === to) return;
    setSections(moveItem(sections, from, to));
    setAnnouncement(`Section moved to position ${to + 1} of ${sections.length}.`);
  }
  const [state, action, pending] = useActionState(saveOutline.bind(null, id), { error: "" });
  const assigned = sections.reduce((sum, row) => sum + (Number(row.count) || 0), 0);
  const expected = Number(total);
  const valid = !!parseQuizOutline(sections, total);
  const validTotal = Number.isInteger(expected) && expected >= 1 && expected <= 200;
  const validCounts = sections.every(section => Number.isInteger(section.count) && section.count >= 1 && section.count <= 200);
  return <form action={action} className={styles.form}>
    <section className={styles.totalCard}><div className={styles.step}>01 <span>/</span> THE BIG PICTURE</div><div className={styles.totalBody}><div><h2>How many questions?</h2><p>Choose a total first. You’ll split these into sections below.</p></div><label className={styles.totalInput}><span>Total questions</span><input type="number" min="1" max="200" value={total} onChange={e => setTotal(e.target.value)} aria-label="Total questions" required /><small>1–200 questions</small></label></div></section>
    <section className={styles.sectionsCard}><div className={styles.sectionHead}><div><div className={styles.step}>02 <span>/</span> BUILD YOUR OUTLINE</div><h2>Divide into sections</h2><p>Choose a question type and how many questions belong in each section.</p></div><div className={styles.counter}><strong>{assigned}<span> / {Number.isInteger(expected) && expected > 0 ? expected : "—"}</span></strong><small>QUESTIONS ASSIGNED</small></div></div>
      <div className={styles.rows} data-reorder-list>{sections.map((section, i) => { const start = sections.slice(0, i).reduce((sum, previous) => sum + (Number(previous.count) || 0), 0) + 1; const end = start + (Number(section.count) || 0) - 1; return <div className={styles.sectionRow} key={section.id} data-reorder-id={section.id}><div className={styles.sectionIndex}>{String(i + 1).padStart(2, "0")}</div><div className={styles.rowFields}><label>Question type<select value={section.type} onChange={e => setSections(old => old.map((row, idx) => idx === i ? { ...row, type: e.target.value as OutlineType } : row))}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Questions<input type="number" min="1" max="200" value={section.count || ""} onChange={e => setSections(old => old.map((row, idx) => idx === i ? { ...row, count: Number(e.target.value) } : row))} required /></label><div className={styles.range}><span>QUESTION RANGE</span><strong>{section.count > 0 ? `${start}–${end}` : "—"}</strong></div></div><div className={styles.rowActions}>{sections.length > 1 && <><ReorderControls id={section.id} label={`section ${i + 1}`} first={i === 0} last={i === sections.length - 1} onMove={moveSection} /><button type="button" className={styles.remove} aria-label={`Remove section ${i + 1}`} onClick={() => setSections(old => old.filter((_, idx) => idx !== i))}>Remove</button></>}</div></div>; })}</div><p className={styles.srOnly} aria-live="polite">{announcement}</p>
      <div className={styles.addRow}><button type="button" className={styles.addButton} disabled={sections.length >= 50} onClick={() => setSections(old => [...old, { id: crypto.randomUUID(), type: "IDENTIFICATION", count: Math.max(1, expected - assigned) }])}><span>＋</span> Add section</button>{sections.length > 1 && <p>Hold the handle to move a section, or use the arrows. Question numbers update automatically.</p>}</div>
    </section>
    <div className={`${styles.summary} ${valid ? styles.summaryReady : ""}`} role="status"><span className={styles.summaryIcon}>{valid ? "✓" : "!"}</span><div><strong>{valid ? "Your outline is ready" : !validTotal ? "Enter a total from 1 to 200" : !validCounts ? "Enter a count for each section" : assigned > expected ? `${assigned - expected} too many questions` : `${Math.max(0, expected - assigned)} questions left to assign`}</strong><p>{valid ? `${sections.length} ${sections.length === 1 ? "section" : "sections"} · ${assigned} questions. You can fill in each question next.` : "The total and section counts must match before continuing."}</p></div></div>
    {editing && <p className={styles.editHint}>This is your saved outline. Changing it replaces the empty question slots; you can also go back without making changes.</p>}
    <input type="hidden" name="total" value={total} /><input type="hidden" name="sections" value={JSON.stringify(sections)} />{state.error && <p className={styles.error} role="alert">{state.error}</p>}<div className={styles.footer}><Link href={`/quizzes/${encodeURIComponent(id)}`}>{editing ? "Back without changes" : "Set up manually instead"}</Link><button className={styles.primary} disabled={!valid || pending} aria-busy={pending} type="submit">{pending ? "Saving…" : editing ? "Save outline changes" : "Confirm outline"} <span>→</span></button></div>
  </form>;
}
