"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { MAX_GENERATE_COUNT, MAX_MODULES, MAX_MODULE_PAGES, MAX_MODULE_CHARS, MAX_PAGE_CHARS, MAX_PDF_BYTES, type ModuleSummary, type ModulePage } from "@/lib/module-content";
import type { SuggestedQuestion } from "@/lib/suggested-questions";
import SuggestionCard from "./suggestion-card";
import styles from "./module-workshop.module.css";

type Slot = { id: string; type: string; number: number; points: string; text: string };
type Section = { id: string; title: string; questions: Slot[] };
type Draft = { suggestion: SuggestedQuestion; revision: number };

async function readPdf(file: File, progress: (value: string) => void): Promise<ModulePage[]> {
  if (!file.name.toLowerCase().endsWith(".pdf") || file.size < 5 || file.size > MAX_PDF_BYTES) throw new Error("Choose a PDF under 10 MB.");
  const data = await file.arrayBuffer();
  if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-") throw new Error("This file is not a valid PDF.");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loading = pdfjs.getDocument({ data });
  try {
    const pdf = await loading.promise;
    if (pdf.numPages > MAX_MODULE_PAGES) throw new Error(`This PDF has more than ${MAX_MODULE_PAGES} pages. Split it into smaller files.`);
    const pages: ModulePage[] = []; let total = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      progress(`Reading ${file.name} · page ${number} of ${pdf.numPages}…`);
      const page = await pdf.getPage(number);
      try {
        const content = await page.getTextContent();
        const text = content.items.map(item => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("").replace(/[ \t]+/g, " ").trim();
        if (text.length > MAX_PAGE_CHARS) throw new Error(`Page ${number} contains too much text. Split or simplify the file.`);
        total += text.length;
        if (total > MAX_MODULE_CHARS) throw new Error("This PDF contains too much text. Split it into smaller files.");
        pages.push({ page: number, text });
      } finally { page.cleanup(); }
    }
    if (!pages.some(page => page.text.length >= 40)) throw new Error("No readable text found. Scanned or image-only PDFs are not supported yet.");
    return pages;
  } finally { await loading.destroy(); }
}

export default function ModuleWorkshop({ quizId, initialModules, sections }: { quizId: string; initialModules: ModuleSummary[]; sections: Section[] }) {
  const [modules, setModules] = useState(initialModules);
  const [selected, setSelected] = useState<string[]>(() => initialModules.map(module => module.id));
  const [excluded, setExcluded] = useState<string[]>([]);
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState("moderate");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saved, setSaved] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const rotation = useRef(0);
  const section = sections.find(item => item.id === sectionId) ?? sections[0];
  const slots = section?.questions.filter(question => !question.text.trim() && !saved.includes(question.id)) ?? [];
  const pendingDrafts = slots.filter(question => drafts[question.id]);
  const missing = slots.filter(question => !drafts[question.id]);
  const anyDrafts = Object.keys(drafts).length > 0;
  useEffect(() => {
    if (!anyDrafts) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const warnOnNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      if (!window.confirm("Leave this page? Your unsaved question suggestions and edits will be lost.")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", warnOnNavigation, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", warnOnNavigation, true); };
  }, [anyDrafts]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = "";
    if (!files.length) return;
    if (modules.length + files.length > MAX_MODULES) { setError(`Add up to ${MAX_MODULES} PDFs per quiz.`); return; }
    setUploading(true); setError(""); setMessage(""); const errors: string[] = []; let added = 0;
    for (const file of files) {
      try {
        const pages = await readPdf(file, setMessage);
        setMessage(`Saving extracted text from ${file.name}…`);
        const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name.slice(0, 120), pages }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save module.");
        setModules(previous => [...previous, result.module]); setSelected(previous => [...previous, result.module.id]); added++;
      } catch (err) { errors.push(`${file.name}: ${err instanceof Error ? err.message : "Could not read this file."}`); }
    }
    setUploading(false); setMessage(errors.length ? added ? "Other successfully processed modules were saved." : "" : "Modules are ready. Select a section to suggest questions."); if (errors.length) setError(errors.join(" "));
  }
  async function removeModule(module: ModuleSummary) {
    const affected = Object.values(drafts).filter(draft => draft.suggestion.sourceModuleId === module.id).length;
    if (!window.confirm(`Remove ${module.name}?${affected ? ` This also discards ${affected} unsaved suggestion${affected === 1 ? "" : "s"} using this module.` : " Saved questions keep their source labels."}`)) return;
    setUploading(true); setError("");
    try { const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/modules/${encodeURIComponent(module.id)}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not remove module."); setModules(old => old.filter(item => item.id !== module.id)); setSelected(old => old.filter(id => id !== module.id)); setExcluded(old => old.filter(id => !id.startsWith(`${module.id}:`))); setDrafts(old => Object.fromEntries(Object.entries(old).filter(([,draft]) => draft.suggestion.sourceModuleId !== module.id))); setMessage("Module removed."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not remove module."); } finally { setUploading(false); }
  }
  async function generate(ids: string[], replace: boolean) {
    if (!section || !ids.length || busy || uploading) return;
    if (!selected.length) { setError("Select at least one module first."); return; }
    const replacing = ids.filter(id => drafts[id]).length;
    if (replace && replacing && !window.confirm(`Replace ${replacing} unsaved suggestion${replacing === 1 ? "" : "s"}? Any edits to those suggestions will be lost. This may use several Groq requests. Saved questions will not change.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const wanted = section.questions.filter(question => ids.includes(question.id) && !question.text.trim() && !saved.includes(question.id));
      const types = [...new Set(wanted.map(question => question.type))]; let done = 0;
      for (const type of types) {
        const questions = wanted.filter(question => question.type === type);
        for (let index = 0; index < questions.length; index += MAX_GENERATE_COUNT) {
          const group = questions.slice(index, index + MAX_GENERATE_COUNT);
          setMessage(`Generating ${done + 1}–${done + group.length} of ${wanted.length} suggestions…`);
          const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/suggest-questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId: section.id, questionIds: group.map(question => question.id), moduleIds: selected, excluded, rotation: rotation.current++ % 10000, difficulty }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.retryAfterSeconds ? `${result.error} Retry in about ${result.retryAfterSeconds} seconds.` : result.error || "Could not generate questions.");
          setDrafts(previous => { const next = { ...previous }; for (const suggestion of result.suggestions as SuggestedQuestion[]) next[suggestion.questionId] = { suggestion, revision: (previous[suggestion.questionId]?.revision ?? 0) + 1 }; return next; });
          done += group.length;
        }
      }
      setMessage("Suggestions are ready to review. Verify each question, answer and source before saving.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate suggestions."); setMessage("Any earlier suggestions are still available below."); } finally { setBusy(false); }
  }
  function savedQuestion(id: string) { setSaved(old => [...old, id]); setDrafts(old => { const next = { ...old }; delete next[id]; return next; }); setMessage("Question saved to the quiz and answer key."); }

  return <details className={styles.workshop}><summary><span><strong>Suggest questions from modules</strong><small>Optional · PDF lessons → editable question drafts</small></span><span className={styles.summaryArrow}>＋</span></summary><div className={styles.body}>
    <div className={styles.intro}><span className={styles.kicker}>01 / SOURCE MATERIAL</span><h2>Add your modules</h2><p>Upload up to 3 text-based PDFs. CheckMate extracts and stores their text and page references; the original PDFs are not stored. Scanned pages may not be readable.</p><label className={styles.upload}>＋ Add PDFs<input type="file" accept="application/pdf,.pdf" multiple disabled={uploading || busy || modules.length >= MAX_MODULES} onChange={upload} /></label><small>Up to 10 MB and 150 pages per PDF · 3 PDFs per quiz</small></div>
    {modules.length > 0 && <div className={styles.modules}>{modules.map(module => <article key={module.id} className={styles.module}><div className={styles.moduleTop}><label className={styles.moduleSelect}><input type="checkbox" checked={selected.includes(module.id)} disabled={busy || uploading} onChange={e => setSelected(old => e.target.checked ? [...old, module.id] : old.filter(id => id !== module.id))} /><span><strong>{module.name}</strong><small>{module.pages.filter(page => page.readable).length} of {module.pages.length} pages have readable text</small></span></label><button type="button" className={styles.textButton} disabled={busy || uploading} onClick={() => removeModule(module)}>Remove</button></div><details className={styles.headings}><summary>Review page headings and exclude pages</summary><p>Headings are detected from the first line and may not describe the whole page. Excluded pages won’t be sent for generation.</p><div className={styles.pageList}>{module.pages.map(page => { const key = `${module.id}:${page.page}`; return <label key={key}><input type="checkbox" disabled={!page.readable || busy || uploading} checked={page.readable && !excluded.includes(key)} onChange={e => setExcluded(old => e.target.checked ? old.filter(value => value !== key) : [...old, key])} /><span><strong>Page {page.page}</strong> · {page.heading}</span></label>; })}</div></details></article>)}</div>}
    <div className={styles.generator}><span className={styles.kicker}>02 / QUESTION DRAFTS</span><h2>Suggest by section</h2><p>Each request samples a few readable pages from selected modules—not the entire module. Generation sends those excerpts to Groq and uses your API quota. Verify coverage, sources, and answers.</p>
      {sections.length ? <><div className={styles.generatorFields}><label>Section<select value={section?.id ?? ""} disabled={busy || uploading} onChange={e => setSectionId(e.target.value)}>{sections.map(item => <option value={item.id} key={item.id}>{item.title} · {item.questions.length} questions</option>)}</select></label><label>Difficulty<select value={difficulty} disabled={busy || uploading} onChange={e => setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="challenging">Challenging</option></select></label></div><div className={styles.generatorActions}><button type="button" className={styles.primary} disabled={busy || uploading || !selected.length || !missing.length} onClick={() => generate(missing.slice(0, 10).map(question => question.id), false)}>{missing.length ? `✦ Suggest next ${Math.min(10, missing.length)} ${missing.length === 1 ? "question" : "questions"}` : "No more empty slots"}</button>{pendingDrafts.length > 0 && <button type="button" className={styles.secondary} disabled={busy || uploading || !selected.length} onClick={() => generate(pendingDrafts.map(question => question.id), true)}>Regenerate section drafts</button>}</div><small>New suggestions: up to 10 per click, requested in groups of {MAX_GENERATE_COUNT}. Regenerating a whole section may use more requests. Existing saved questions are never replaced.</small>{!slots.length && <p className={styles.note}>No empty question slots in this section. Add an empty slot using the outline to generate suggestions.</p>}{slots.length > 0 && <p className={styles.note}>{slots.length} empty {slots.length === 1 ? "slot" : "slots"} · {pendingDrafts.length} unsaved {pendingDrafts.length === 1 ? "suggestion" : "suggestions"}</p>}</> : <p className={styles.note}>Create an outline with question slots first.</p>}
    </div>
    {message && <p className={styles.message} role="status">{message}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
    {sections.map(item => { const items = item.questions.filter(question => !question.text.trim() && !saved.includes(question.id) && drafts[question.id]); if (!items.length) return null; return <div key={item.id} hidden={item.id !== section?.id} className={styles.drafts}><div><span className={styles.kicker}>03 / REVIEW</span><h3>Your suggestions</h3><p>Suggestions are unsaved and disappear if you leave this page. Review each source and save the questions you want.</p></div>{items.map(slot => { const draft = drafts[slot.id]; return <SuggestionCard key={`${slot.id}-${draft.revision}`} quizId={quizId} slot={slot} suggestion={draft.suggestion} busy={busy || uploading} onSaved={savedQuestion} onRegenerate={id => generate([id], true)} />; })}</div>; })}
  </div></details>;
}
