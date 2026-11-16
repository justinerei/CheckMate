"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { currentPagination, paginate, type Pagination } from "@/lib/pagination";
import { groupSectionRubrics } from "@/lib/print-rubrics";
import { questionRows, sectionDirections, validQuestionLayout } from "@/lib/standard-quiz-layout";
import { instructionTemplates } from "@/lib/instruction-templates";
import PrintDocumentTitle from "../print-document-title";
import styles from "./print.module.css";

type Question = { id: string; type: string; text: string; besideNext: boolean; essayLineCount: number | null; choices: { id: string; label: string; text: string }[]; rubric: { id: string; title: string; description: string; points: string }[] };
type Section = { id: string; title: string; instructions: string; questionLayout: string; questions: Question[] };
type Block = { kind: "header"; title: string } | { kind: "instructions"; text: string } | { kind: "section"; title: string; instructions: string; number: number; keepWithNext: boolean; twoColumns: boolean } | { kind: "row"; questions: { question: Question; number: number }[]; flow?: string } | { kind: "rubric"; rubric: Question["rubric"]; numbers: number[] };
type Paper = { page: string; width: string; height: string; label: string };

function BlockContent({ block }: { block: Block }) {
  if (block.kind === "header") return <header className={styles.paperHeader}><h1>{block.title}</h1><div className={styles.fields}><div>Name: <span /></div><div>Date: <span /></div><div>Section: <span /></div></div></header>;
  if (block.kind === "instructions") return <div className={styles.generalInstructions}><strong>Instructions:</strong> {block.text}</div>;
  if (block.kind === "section") return <div className={styles.sectionHeading}><h2>{block.number}. {block.title}</h2>{block.instructions && <p>{block.instructions}</p>}{block.twoColumns && <p className={styles.columnHint}>Read down the left column, then the right column.</p>}</div>;
  if (block.kind === "rubric") return <table className={styles.rubric}><caption>Scoring criteria · {block.numbers.length === 1 ? "Question" : "Questions"} {block.numbers.join(", ")}</caption><thead><tr><th scope="col">Criterion</th><th scope="col">Description</th><th scope="col">Points</th></tr></thead><tbody>{block.rubric.map(criterion => <tr key={criterion.id}><td>{criterion.title}</td><td>{criterion.description}</td><td>{criterion.points}</td></tr>)}</tbody></table>;
  return <div className={block.questions.length === 2 ? styles.pair : styles.row}>{block.questions.map(({ question, number }) => <div className={styles.question} key={question.id}>
    <div className={styles.prompt}>{(question.type === "TRUE_FALSE" || question.type === "IDENTIFICATION") && <span className={question.type === "TRUE_FALSE" ? styles.shortBlank : styles.longBlank} />}<span>{number}. {question.text}</span></div>
    {question.type === "MULTIPLE_CHOICE" && <div className={`${styles.choices} ${(block.flow || block.questions.length === 2) && question.choices.some(choice => choice.text.length > 40) ? styles.longChoices : ""}`}>{question.choices.map(choice => <span className={styles.choice} key={choice.id}><span>{choice.label}.</span><span>{choice.text}</span></span>)}</div>}
    {question.type === "ESSAY" && <div className={styles.lines}>{Array.from({ length: question.essayLineCount ?? 7 }, (_, n) => <div key={n} />)}</div>}
  </div>)}</div>;
}

function PageBlocks({ indices, blocks, columnsByBlock }: { indices: number[]; blocks: Block[]; columnsByBlock: Pagination["columnsByBlock"] }) {
  const content: React.ReactNode[] = [];
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i], block = blocks[index];
    if (block.kind === "row" && block.flow) {
      const group: number[] = [];
      while (i < indices.length) { const candidate = blocks[indices[i]]; if (candidate.kind !== "row" || candidate.flow !== block.flow) break; group.push(indices[i]); i++; }
      i--;
      content.push(<div className={styles.flowColumns} key={`flow-${index}`}>{[0, 1].map(lane => <div key={lane}>{group.filter(item => columnsByBlock[item] === lane).map(item => <div className={styles.block} key={item}><BlockContent block={blocks[item]} /></div>)}</div>)}</div>);
    } else content.push(<div className={styles.block} key={index}><BlockContent block={block} /></div>);
  }
  return <>{content}</>;
}

export default function PagedPreview({ title, generalInstructions, code, paper, numbering, sections, back }: { title: string; generalInstructions: string; code: string; paper: Paper; numbering: string; sections: Section[]; back: { href: string; label: string } }) {
  const [labels, setLabels] = useState(true);
  const hasSavedPairings = sections.some(section => section.questions.length > 1 && (section.questionLayout === "TWO_COLUMN" && section.questions.every(question => question.type === "MULTIPLE_CHOICE") || section.questionLayout === "CUSTOM" && section.questions.some((question, index) => question.besideNext && index + 1 < section.questions.length)));
  const [standard, setStandard] = useState(() => !hasSavedPairings);
  const [measurement, setMeasurement] = useState<{ blocks: Block[]; width: string; height: string; layout: Pagination } | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const blocks = useMemo<Block[]>(() => {
    const output: Block[] = [{ kind: "header", title }];
    if (generalInstructions.trim()) output.push({ kind: "instructions", text: generalInstructions });
    let total = 0;
    sections.forEach((section, index) => {
      const start = numbering === "RESET_PER_SECTION" ? 0 : total;
      total += section.questions.length;
      const preset = section.questions.every(question => question.type === "MULTIPLE_CHOICE") && validQuestionLayout(section.questionLayout) ? section.questionLayout : "CUSTOM";
      output.push({ kind: "section", title: section.title, instructions: sectionDirections(section.instructions, section.questions.map(question => question.type), instructionTemplates, standard || section.questionLayout !== "CUSTOM"), number: index + 1, keepWithNext: section.questions.length > 0, twoColumns: !standard && preset === "TWO_COLUMN" });
      if (!standard && preset === "TWO_COLUMN") section.questions.forEach((question, position) => output.push({ kind: "row", flow: section.id, questions: [{ question, number: start + position + 1 }] }));
      else for (const row of questionRows(section.questions, start, standard, preset)) output.push({ kind: "row", questions: row });
      for (const group of groupSectionRubrics(section.questions, start)) output.push({ kind: "rubric", ...group });
    });
    return output;
  }, [title, generalInstructions, numbering, sections, standard]);
  const layout = currentPagination(measurement, blocks, paper.width, paper.height);
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const root = measureRef.current;
      const body = root?.querySelector<HTMLElement>("[data-page-body]");
      if (!root || !body) return;
      const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-block]"));
      if (elements.length !== blocks.length) return;
      const capacity = body.getBoundingClientRect().height - 2;
      const measurements = elements.map((element, index) => ({ height: element.getBoundingClientRect().height, keepWithNext: blocks[index].kind === "section" && blocks[index].keepWithNext, flow: blocks[index].kind === "row" ? blocks[index].flow : undefined }));
      if (!cancelled && capacity > 0) setMeasurement({ blocks, width: paper.width, height: paper.height, layout: paginate(measurements, capacity) });
    };
    measure();
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => { cancelled = true; window.removeEventListener("resize", measure); };
  }, [blocks, paper.width, paper.height]);
  const dimensions = { "--paper-width": paper.width, "--paper-height": paper.height } as React.CSSProperties;
  return <main className={styles.preview}><PrintDocumentTitle title={title} kind="quiz" /><style>{`@page { size: ${paper.page}; margin: 0; }`}</style>
    <div className={styles.toolbar}><Link className="back-navigation" href={back.href}>{back.label}</Link><span>Paper: {paper.label} · Quiz: {code}</span><div className={styles.controls}><label><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} /> Include page labels</label><button type="button" disabled={!layout || layout.oversized.length > 0} onClick={() => window.print()}>Print / Save as PDF</button></div>
      <div className={styles.templateInfo}><strong>{standard ? "Standard layout" : "Saved question layout"}</strong><span>{standard ? "One question per row. CheckMate expects circled multiple-choice answers and written true/false and identification answers; make sure your instructions match." : "Uses the side-by-side placements saved in this quiz."}</span>{hasSavedPairings && <><label><input type="checkbox" checked={standard} onChange={event => setStandard(event.target.checked)} /> Use standard one-question-per-row layout</label><span>Layout selection applies to this preview; choose it again when reprinting.</span></>}</div>
      <p className={styles.hint}>Pages are arranged automatically. In the print dialog, select the same paper size shown above, set margins to None and scale to 100%, and turn off browser headers and footers. The code identifies the quiz, not the version; reprint all pages after edits.</p>
      {layout && layout.oversized.length > 0 && <p className={styles.warning} role="alert">A question or section is too long to fit on one page. Shorten its text or rubric descriptions, reduce its essay lines, or turn off side-by-side layout before printing.</p>}
    </div>
    <div className={styles.measure} aria-hidden="true" ref={measureRef}><div className={styles.paper} style={dimensions}><div className={styles.pageBody} data-page-body>{blocks.map((block, index) => <div data-block key={index} className={`${styles.block} ${block.kind === "row" && block.flow ? styles.flowMeasure : ""}`}><BlockContent block={block} /></div>)}</div></div></div>
    <div className={styles.stack}>{!layout ? <p className={styles.loading}>Preparing page preview…</p> : layout.pages.map((page, pageIndex) => <article className={styles.paper} style={dimensions} key={pageIndex} aria-label={`Page ${pageIndex + 1} of ${layout.pages.length}`}><div className={styles.pageBody}><PageBlocks indices={page} blocks={blocks} columnsByBlock={layout.columnsByBlock} /></div>{labels && <footer className={styles.pageFooter}>{code} · Page {pageIndex + 1} of {layout.pages.length}</footer>}</article>)}</div>
  </main>;
}
