import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { matchCandidates, parseExtraction, type ExtractionItem } from "@/lib/extraction";
import AnswerForm from "./answer-form";
import styles from "../../submissions.module.css";

export const instant = false;
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, include: { student: true, pages: { orderBy: { pageNumber: "asc" } }, answers: true, quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" } } } } } } } });
  if (!submission) notFound();
  const unfinished = submission.pages.filter(page => page.status !== "COMPLETE");
  let counter = 0;
  const questions = submission.quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: submission.quiz.numbering === "CONTINUOUS" ? ++counter : position + 1, section: index + 1, sectionTitle: section.title })));
  const suggestions: Record<string, { item: ExtractionItem; page: number }[]> = Object.create(null);
  const unmatched: { item: ExtractionItem; page: number }[] = [];
  for (const page of submission.pages) {
    const parsed = page.extraction ? parseExtraction(JSON.stringify(page.extraction)) : null;
    if (!parsed) continue;
    const mapped = matchCandidates(questions, parsed.items);
    for (const [questionId, items] of Object.entries(mapped.byQuestion)) (suggestions[questionId] ??= []).push(...items.map(item => ({ item, page: page.pageNumber })));
    unmatched.push(...mapped.unmatched.map(item => ({ item, page: page.pageNumber })));
  }
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href={`/submissions/${id}`} className={styles.back}>← Back to photos</Link></header><div className={styles.content}><p className={styles.eyebrow}>STUDENT PAPER / REVIEW</p><h1>Review answers</h1><p className={styles.description}>{submission.student.name} · {submission.quiz.title}. AI suggestions can be wrong. Open the original photos and confirm each answer yourself.</p>{unfinished.length > 0 && <div className={styles.confirm} role="status"><h2>Extract answers first</h2><p>{unfinished.map(page => `Page ${page.pageNumber}: ${page.status.toLowerCase()}`).join(" · ")}. Go back to the photos and select Extract answers for each page. Each photo is sent to Groq only when you select it.</p><Link className={styles.primary} href={`/submissions/${id}`}>Go to photos</Link></div>}<div className={styles.links}>{submission.pages.map(page => <a key={page.id} href={`/api/submissions/${id}/pages/${page.id}`} target="_blank" rel="noreferrer">Open page {page.pageNumber} ↗</a>)}</div>{unmatched.length > 0 && <div className={styles.confirm}><h2>Suggestions needing manual matching</h2><p>These couldn’t be matched to a single question. Check the photo and enter each answer below.</p>{unmatched.map(({ item, page }, i) => <p key={i}>Page {page}, question {item.number ?? "unknown"}, section {item.section ?? "unknown"}: {item.answer ?? "no readable answer"} ({item.status}) {item.note}</p>)}</div>}{questions.map(question => { const items = suggestions[question.id] ?? []; const saved = submission.answers.find(answer => answer.questionId === question.id); return <section key={question.id} className={styles.confirm}><p className={styles.eyebrow}>SECTION {question.section} / QUESTION {question.number} · {question.sectionTitle}</p><h2>{question.text}</h2>{items.length === 0 ? <p>{unfinished.length > 0 ? "No matched suggestion yet. Some pages still need extraction; check the photo." : "No matched suggestion. Check the photo."}</p> : <><p>{items.length > 1 ? "Multiple suggestions — check carefully:" : "AI suggestion — verify against the photo:"}</p>{items.map(({ item, page }, i) => <p key={i}>Page {page}: {item.answer ?? "no readable answer"} ({item.status}) {item.note}</p>)}</>}{saved && <p>Saved: {saved.confirmedText || "Marked blank"}</p>}{submission.status === "IN_REVIEW" && <AnswerForm submissionId={id} questionId={question.id} value={saved?.confirmedText ?? null} />}</section>; })}</div></main>;
}
