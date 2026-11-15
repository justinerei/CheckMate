"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { needsReviewConfirmation } from "@/lib/review-navigation-guard";
import { ReviewDraftContext } from "../../review-draft-context";
import PhotoPreview from "../../photo-preview";
import styles from "./workspace.module.css";

type Item = { id: string; number: number; flagged: boolean; detected: number[]; form: ReactNode };
type Page = { id: string; pageNumber: number };
type View = "review" | "all" | "score";

export default function ReviewWorkspace({ id, items, pages, name, score, finalized, nameReviewed, reviewBlocked, finalizationReason }: {
  id: string; items: Item[]; pages: Page[]; name: ReactNode; score: ReactNode; finalized: boolean; nameReviewed: boolean; reviewBlocked: boolean; finalizationReason: string | null;
}) {
  const flagged = items.filter(item => item.flagged);
  const [view, setView] = useState<View>(finalized || !flagged.length ? "score" : "review");
  const [selection, setSelection] = useState("");
  const [dirty, setDirty] = useState<string[]>([]);
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [prompt, setPrompt] = useState<{ id: string; navigate: () => void } | null>(null);
  const pendingNavigation = useRef<{ id: string; navigate: () => void } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const markDirty = useCallback((id: string) => setDirty(old => old.includes(id) ? old : [...old, id]), []);
  const saveResult = useCallback((id: string, ok: boolean) => {
    if (ok) setDirty(old => old.filter(item => item !== id));
    if (pendingNavigation.current?.id === id) { const next = pendingNavigation.current; pendingNavigation.current = null; if (ok) next.navigate(); }
  }, []);
  useEffect(() => { if (prompt && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [prompt]);
  useEffect(() => { if (!dirty.length) return; const warn = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
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
  const navigate = (destination: string, apply: () => void) => {
    if (active && needsReviewConfirmation(dirty.includes(active.id), `${currentView}:${active.id}`, destination)) setPrompt({ id: active.id, navigate: apply });
    else apply();
  };
  const select = (key: string) => navigate(`${currentView}:${key}`, () => { setSelection(key); setManualPage(null); });
  const changeView = (next: View) => navigate(`${next}:${active?.id ?? ""}`, () => setView(next));
  const dismissPrompt = () => { dialog.current?.close(); setPrompt(null); };
  const saveAndContinue = () => {
    if (!prompt) return;
    const form = Array.from(workspace.current?.querySelectorAll<HTMLFormElement>("form[data-review-question]") ?? []).find(item => item.dataset.reviewQuestion === prompt.id);
    const next = prompt; dismissPrompt();
    if (!form || !form.reportValidity()) return;
    pendingNavigation.current = next;
    form.requestSubmit();
  };
  const discardAndContinue = () => {
    if (!prompt) return;
    const next = prompt;
    setDirty(old => old.filter(item => item !== next.id));
    setVersions(old => ({ ...old, [next.id]: (old[next.id] ?? 0) + 1 }));
    dismissPrompt(); next.navigate();
  };
  return <ReviewDraftContext.Provider value={{ markDirty, saveResult }}><div ref={workspace} className={styles.workspace} onInputCapture={event => { const form = (event.target as HTMLElement).closest("form[data-review-question]") as HTMLFormElement | null; if (form?.dataset.reviewQuestion) markDirty(form.dataset.reviewQuestion); }} onChangeCapture={event => { const form = (event.target as HTMLElement).closest("form[data-review-question]") as HTMLFormElement | null; if (form?.dataset.reviewQuestion) markDirty(form.dataset.reviewQuestion); }}>
    {name}
    <nav className={styles.tabs} aria-label="Review views">
      {([["review", `Needs review (${flagged.length})`], ["all", `All answers (${items.length})`], ["score", "Score"]] as const).map(([key,label]) =>
        <button key={key} type="button" aria-pressed={currentView === key} disabled={key === "review" && !flagged.length} onClick={() => changeView(key)}>{label}</button>)}
    </nav>
    <div hidden={currentView !== "score"}>{score}</div>
    <div hidden={currentView === "score"}>
      {active && <div className={styles.columns}>
        <aside className={styles.paper}>
          <div className={styles.row}><strong>Original paper</strong>{photo && <select aria-label="Paper page" value={photo.pageNumber} onChange={e => setManualPage({question:active.id,page:Number(e.target.value)})}>{pages.map(page => <option key={page.id} value={page.pageNumber}>Page {page.pageNumber}</option>)}</select>}</div>
          {photo && <PhotoPreview className={styles.photo} triggerClassName={styles.paperTrigger} triggerLabel="View paper" src={`/api/submissions/${id}/pages/${photo.id}`} alt={`Student paper page ${photo.pageNumber}`} pageOptions={pages.map(page => page.pageNumber)} selectedPage={photo.pageNumber} onPageChange={page => setManualPage({ question: active.id, page })} />}
          {!active.detected.length && <small>Page unknown. Choose a page to check the answer.</small>}
        </aside>
        <section className={styles.question}>
          <div className={styles.row}><span aria-live="polite">{index + 1} of {queue.length} {currentView === "review" ? "to review" : "answers"}</span>
            <select aria-label="Choose question" value={active.id} onChange={e => select(e.target.value)}>{queue.map(item => <option key={item.id} value={item.id}>Question {item.number}</option>)}</select></div>
          {new Set(active.detected).size > 1 && <div className={styles.pageChoices} role="group" aria-label="Paper photos with readings"><span>Check paper photos:</span>{[...new Set(active.detected)].map(page => <button type="button" key={page} aria-pressed={photo?.pageNumber === page} onClick={() => setManualPage({ question: active.id, page })}>View page {page}</button>)}</div>}
          {dirty.includes(active.id) && <p className={styles.unsaved} role="status">Unsaved changes</p>}
          {items.map(item => <div key={`${item.id}:${versions[item.id] ?? 0}`} hidden={item.id !== active.id}>{item.form}</div>)}
          <div className={styles.row}><button disabled={index === 0} onClick={() => select(queue[index-1].id)}>← Previous</button><button disabled={index === queue.length-1} onClick={() => select(queue[index+1].id)}>Next →</button></div>
        </section>
      </div>}
    </div>
    {!finalized && <p role="status">{flagged.length ? `${flagged.length} answers awaiting confirmation.` : "No matched answers need attention."} {!nameReviewed ? "Confirm the student name to finish." : reviewBlocked ? "Confirm all answers to resolve unmatched readings." : finalizationReason ? finalizationReason : !flagged.length && "Ready to finalize in Score."}</p>}
    {prompt && <dialog ref={dialog} className={styles.draftDialog} aria-labelledby="draft-dialog-title" aria-describedby="draft-dialog-description" onCancel={event => { event.preventDefault(); dismissPrompt(); }}><h2 id="draft-dialog-title">Save your changes?</h2><p id="draft-dialog-description">You have edits for this answer that haven’t been confirmed.</p><div className={styles.dialogActions}><button type="button" onClick={dismissPrompt} autoFocus>Stay</button><button type="button" onClick={discardAndContinue}>Discard changes</button><button type="button" onClick={saveAndContinue}>Save &amp; continue</button></div></dialog>}
  </div></ReviewDraftContext.Provider>;
}
