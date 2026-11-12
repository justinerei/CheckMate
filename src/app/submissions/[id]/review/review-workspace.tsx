"use client";
import { useState, type ReactNode } from "react";
import PhotoPreview from "../../photo-preview";
import styles from "./workspace.module.css";

type Item = { id: string; number: number; flagged: boolean; detected: number[]; form: ReactNode };
type Page = { id: string; pageNumber: number };
type View = "review" | "all" | "score";

export default function ReviewWorkspace({ id, items, pages, name, score, finalized, nameReviewed }: {
  id: string; items: Item[]; pages: Page[]; name: ReactNode; score: ReactNode; finalized: boolean; nameReviewed: boolean;
}) {
  const flagged = items.filter(item => item.flagged);
  const [view, setView] = useState<View>(finalized || !flagged.length ? "score" : "review");
  const [selection, setSelection] = useState("");
  const [manualPage, setManualPage] = useState<{ question: string; page: number } | null>(null);
  const currentView = view === "review" && !flagged.length ? "score" : view;
  const queue = currentView === "review" ? flagged : items;
  const selectedIndex = items.findIndex(item => item.id === selection);
  const active = queue.find(item => item.id === selection)
    ?? items.slice(selectedIndex + 1).find(item => queue.includes(item))
    ?? queue[0];
  const index = queue.indexOf(active);
  const selectedNumber = manualPage?.question === active?.id ? manualPage?.page : active?.detected[0];
  const photo = pages.find(page => page.pageNumber === selectedNumber) ?? pages[0];
  const select = (key: string) => { setSelection(key); setManualPage(null); };
  return <div className={styles.workspace}>
    {name}
    <nav className={styles.tabs} aria-label="Review views">
      {([["review", `Needs review (${flagged.length})`], ["all", `All answers (${items.length})`], ["score", "Score"]] as const).map(([key,label]) =>
        <button key={key} type="button" aria-pressed={currentView === key} disabled={key === "review" && !flagged.length} onClick={() => setView(key)}>{label}</button>)}
    </nav>
    <div hidden={currentView !== "score"}>{score}</div>
    <div hidden={currentView === "score"}>
      {active && <div className={styles.columns}>
        <aside className={styles.paper}>
          <div className={styles.row}><strong>Original paper</strong>{photo && <select aria-label="Paper page" value={photo.pageNumber} onChange={e => setManualPage({question:active.id,page:Number(e.target.value)})}>{pages.map(page => <option key={page.id} value={page.pageNumber}>Page {page.pageNumber}</option>)}</select>}</div>
          {photo && <PhotoPreview className={styles.photo} src={`/api/submissions/${id}/pages/${photo.id}`} alt={`Student paper page ${photo.pageNumber}`} />}
          {!active.detected.length && <small>Page unknown. Choose a page to check the answer.</small>}
        </aside>
        <section className={styles.question}>
          <div className={styles.row}><span aria-live="polite">{index + 1} of {queue.length} {currentView === "review" ? "to review" : "answers"}</span>
            <select aria-label="Choose question" value={active.id} onChange={e => select(e.target.value)}>{queue.map(item => <option key={item.id} value={item.id}>Question {item.number}</option>)}</select></div>
          {items.map(item => <div key={item.id} hidden={item.id !== active.id}>{item.form}</div>)}
          <div className={styles.row}><button disabled={index === 0} onClick={() => select(queue[index-1].id)}>← Previous</button><button disabled={index === queue.length-1} onClick={() => select(queue[index+1].id)}>Next →</button></div>
        </section>
      </div>}
    </div>
    {!finalized && <p role="status">{flagged.length ? `${flagged.length} answers awaiting confirmation.` : "All answers checked."} {!nameReviewed ? "Confirm the student name to finish." : !flagged.length && "Ready to finalize in Score."}</p>}
  </div>;
}
