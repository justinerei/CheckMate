import { requiresUnmatchedReview } from "@/lib/review-safety";
import { builtAnswerStyle, normalizeBuiltReading } from "@/lib/built-review";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { matchCandidates, parseExtraction, type ExtractionItem } from "@/lib/extraction";
import ReviewBackLink, { ReviewQuizLink } from "./review-back-link";
import NextPaperButton from "../next-paper-button";
import NameForm from "./name-form";
import { ExistingAnswerForm, FinalizeButton } from "./existing-form";
import styles from "../../submissions.module.css";
import { objectivePoints } from "@/lib/scoring";
import { reviewPoints } from "@/lib/review-points";
import { automaticDecision } from "@/lib/auto-review";
import ReviewWorkspace from "./review-workspace";
import { hasInstructionConcern, requiresLetterReview } from "@/lib/auto-review";

export const instant = false;
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, include: { student: true, pages: { orderBy: { pageNumber: "asc" } }, answers: { include: { assessments: true } }, quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true, rubricCriteria: { orderBy: { position: "asc" } } } } } } } } } });
  if (!submission) notFound();
  const unfinished = submission.pages.filter(page => page.status !== "COMPLETE");
  let counter = 0;
  const questions = submission.quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: submission.quiz.numbering === "CONTINUOUS" ? ++counter : position + 1, section: index + 1, sectionTitle: section.title, answerStyle: submission.quiz.source === "BUILT" ? builtAnswerStyle(question.type) : section.answerStyle, instructions: section.instructions })));
  const suggestions: Record<string, { item: ExtractionItem; page: number }[]> = Object.create(null);
  const unmatched: { item: ExtractionItem; page: number }[] = [];
  const nameSuggestions: string[] = [];
  for (const page of submission.pages) {
    const parsed = page.extraction ? parseExtraction(JSON.stringify(page.extraction)) : null;
    if (!parsed) continue;
    if (parsed.studentName?.trim()) nameSuggestions.push(parsed.studentName.trim());
    const mapped = matchCandidates(questions, submission.quiz.source === "EXISTING" ? parsed.items.map(item => ({ ...item, section: null })) : parsed.items);
    for (const [questionId, items] of Object.entries(mapped.byQuestion)) (suggestions[questionId] ??= []).push(...items.map(item => ({ item: submission.quiz.source === "BUILT" ? normalizeBuiltReading(item, questions.find(q => q.id === questionId)!.type) : item, page: page.pageNumber })));
    unmatched.push(...mapped.unmatched.map(item => ({ item, page: page.pageNumber })));
  }
  const nameSuggestion = new Set(nameSuggestions).size === 1 ? nameSuggestions[0] : null;
  const nameReview = submission.status === "IN_REVIEW" ? <NameForm id={id} value={submission.paperName ?? submission.student?.name ?? null} suggestion={nameSuggestion} reviewed={submission.nameReviewed} /> : null;
  {
    const maximum = questions.reduce((sum, q) => sum + Number(q.points), 0);
    const autoDecision = (question: typeof questions[number]) => unfinished.length ? null : automaticDecision((suggestions[question.id] ?? []).map(c => c.item), question.answerStyle, question.type, question.answerKey?.acceptedAnswers);
    const scored = questions.map(question => { const saved = submission.answers.find(a => a.questionId === question.id); const automatic = !saved ? autoDecision(question) : null; const points = reviewPoints(saved, submission.status === "FINALIZED", question.type, question.answerKey?.acceptedAnswers ?? [], Number(question.points), automatic, suggestions[question.id]?.[0]?.item.answer ?? "", objectivePoints); return { question, saved, points }; });
    const flagged = scored.filter(item => item.points === null);
    const unmatchedBlocked = requiresUnmatchedReview(unmatched.length, questions, submission.answers);
    const ready = flagged.length === 0 && submission.nameReviewed && !unmatchedBlocked;
    const provisional = scored.reduce((sum, item) => sum + (item.points ?? 0), 0);
    const items = scored.map(({question, saved, points}) => {
      const candidates = suggestions[question.id] ?? [];
      const single = candidates.length === 1 ? candidates[0].item : null;
      const suggestion = single?.status === "blank" ? "" : single?.status === "clear" ? single.answer : null;
      const automaticViolation = !saved && autoDecision(question) === "VIOLATION";
      const expected = question.answerStyle === "text" ? "written" : question.answerStyle;
      const observed = single?.observedStyle;
      const value = saved?.confirmedText ?? suggestion;
      let reason = "";
      if (points === null) {
        if (requiresLetterReview(single?.answer, question.answerStyle, question.type, question.answerKey?.acceptedAnswers))
          reason = "The key expects a letter. Check the word written on the paper and confirm whether it follows the directions.";
        else if (observed && observed !== "unknown" && observed !== expected)
          reason = `Expected ${expected}; detected ${observed}. Check the mark on the paper.`;
        else if (question.type === "ESSAY") reason = "Score the essay using the teacher’s criteria.";
        else reason = single?.note || (candidates.length > 1 ? "Multiple readings. Compare the pages before confirming." : "Verify the response against the paper.");
      }
      const form = <article>
        <h2>Question {question.number}</h2>
        {reason && <p className={styles.reviewWarning}>{reason}</p>}{automaticViolation && <p className={styles.reviewWarning}>Marked incorrect: the answer is boxed or triangular, but the instruction requires a circle. You can correct this decision after checking the photo.</p>}
        <div className={styles.scoreAnswers}>
          <p><span>{saved ? "Confirmed answer" : "Detected answer"}</span><strong>{candidates.length > 1 && !saved ? "Conflicting readings" : value || (value === "" || single?.status === "blank" ? "Blank" : single?.answer || "Unreadable")}</strong></p>
          <p><span>{question.type === "ESSAY" ? "Reference answer" : "Answer key"}</span><strong>{question.answerKey?.acceptedAnswers.join(" / ") || "Not provided"}</strong></p>
        </div>
        {question.instructions && <p>{question.instructions}</p>}
        {candidates.length > 1 && <ul>{candidates.map((c,i) => <li key={i}>Page {c.page}: {c.item.answer || "Unreadable"} {c.item.note}</li>)}</ul>}
        {submission.status === "FINALIZED" && question.type === "ESSAY" && question.rubricCriteria.map(c => { const assessment = saved?.assessments.find(a => a.criterionId === c.id); return <p key={c.id}>{c.title}: {assessment?.teacherScore?.toString() ?? "—"} / {c.maxPoints.toString()}{assessment?.teacherFeedback ? ` · ${assessment.teacherFeedback}` : ""}</p>; })}{submission.status === "FINALIZED" && question.type !== "ESSAY" && <p>Points awarded: {saved?.objectiveScore?.toString() ?? "0"}</p>}{submission.status === "IN_REVIEW" && <ExistingAnswerForm formatConcern={hasInstructionConcern(candidates.map(c => c.item), question.answerStyle, question.type, question.answerKey?.acceptedAnswers)} advance={points === null} submissionId={id} questionId={question.id} value={saved?.confirmedText ?? suggestion} comment={saved?.teacherComment ?? null} essay={question.type === "ESSAY"} score={saved?.teacherScore?.toString() ?? null} points={question.points.toString()} decision={saved?.instructionDecision ?? null} criteria={question.rubricCriteria.map(c => ({ id: c.id, title: c.title, description: c.description, maxPoints: c.maxPoints.toString(), score: saved?.assessments.find(a => a.criterionId === c.id)?.teacherScore?.toString() ?? "", feedback: saved?.assessments.find(a => a.criterionId === c.id)?.teacherFeedback ?? "" }))} />}</article>;
      return { id: question.id, number: question.number, flagged: points === null, detected: candidates.map(c => c.page), form };
    });
    const score = <section className={styles.keyPanel}><div className={styles.keyHeading}><div><span className={styles.keyEyebrow}>03 / SCORE</span><h2>{submission.status === "FINALIZED" ? "Score breakdown" : "Score preview"}</h2></div></div><div className={styles.scoreOverview}><div><span>{submission.status === "FINALIZED" ? "Final score" : "Total score"}</span>{ready ? <strong>{provisional} <small>/ {maximum}</small></strong> : <strong>Pending review</strong>}</div><p>{ready ? (submission.status === "FINALIZED" ? "This paper has been finalized." : "Review the answers before finalizing.") : `Remaining: ${[!submission.nameReviewed && "confirm student name", flagged.length > 0 && `review ${flagged.length} answers`, unmatchedBlocked && "verify all answers because a reading could not be matched"].filter(Boolean).join(" and ")}.`}</p></div>{submission.status === "IN_REVIEW" && <p>Finalizing locks the score for this paper.</p>}<FinalizeButton batchId={submission.batchId} id={id} name={submission.paperName || submission.student?.name || "Unnamed paper"} quizTitle={submission.quiz.title} maximum={maximum} ready={ready} finalized={submission.status === "FINALIZED"} finalScore={submission.totalScore?.toString() ?? null} /><div className={styles.scoreList} aria-label="Question scores">{scored.map(({ question, saved, points }) => {
      const maximumPoints = Number(question.points);
      const essay = question.type === "ESSAY";
      const outcome = points === null ? "Needs review" : essay || maximumPoints === 0 ? "Scored" : points === maximumPoints ? "Correct" : points === 0 ? "Incorrect" : "Partial credit";
      const outcomeClass = points === null ? styles.scorePending : essay || maximumPoints === 0 || (points > 0 && points < maximumPoints) ? styles.scoreNeutral : points === maximumPoints ? styles.scoreCorrect : styles.scoreIncorrect;
      const candidates = suggestions[question.id] ?? [];
      const response = saved?.confirmedText ?? (candidates.length === 1 && candidates[0].item.status === "clear" ? candidates[0].item.answer : null);
      const answer = response?.trim() || (saved?.confirmedText === "" || (candidates.length === 1 && candidates[0].item.status === "blank") ? "Blank" : "Not available");
      const key = question.answerKey?.acceptedAnswers.join(" / ") || "Not available";
      return <div className={styles.scoreRow} key={question.id}><div className={styles.scoreRowHead}><div className={styles.scoreLabel}><span className={styles.scoreNumber}>{String(question.number).padStart(2, "0")}</span><strong>Question {question.number}</strong><span className={`${styles.scoreBadge} ${outcomeClass}`}>{outcome}</span></div><strong className={styles.scorePoints}>{points === null ? "—" : points} <span>/ {question.points.toString()} pts</span></strong></div><div className={styles.scoreAnswers}><p><span>Student answer</span><strong>{answer}</strong></p>{!essay && <p><span>Correct answer</span><strong>{key}</strong></p>}</div>{(saved?.instructionDecision === "VIOLATION" || (!saved && autoDecision(question) === "VIOLATION")) && <p className={styles.scoreInstruction}>Instructions not followed · {saved?.reviewStatus === "CONFIRMED" ? "confirmed by teacher" : "detected automatically; check the photo"}</p>}</div>;
    })}</div></section>;
    return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><ReviewBackLink id={id} finalized={submission.status === "FINALIZED"} /></header><div className={`${styles.content} ${styles.reviewContent}`}><p className={styles.eyebrow}>QUIZ / REVIEW</p><h1>Review and score</h1><p className={styles.description}>{submission.paperName || submission.student?.name || "Unnamed paper"} · {submission.quiz.title}. </p><p><ReviewQuizLink quizId={submission.quizId} finalized={submission.status === "FINALIZED"} /></p>{submission.batchId && <p><Link href={`/batches/${submission.batchId}`}>← Back to batch</Link></p>}{submission.status === "FINALIZED" && <><p className={styles.success}>Final score: {submission.totalScore?.toString()} / {maximum}</p><div className={styles.resultActions}>{submission.batchId ? <Link className={styles.primary} href={`/batches/${submission.batchId}`}>Back to batch</Link> : <NextPaperButton id={id} />}<Link href={`/submissions/${id}`} className={styles.secondary}>View paper photos</Link></div></>}{unfinished.length > 0 && <p className={styles.help}>Some pages have not been extracted. You can extract them from the photos page, or enter answers manually after checking the photos.</p>}{unmatchedBlocked && <div className={styles.error} role="alert"><strong>Some readings could not be matched to a question.</strong><p>Open All answers and confirm every response against the photos before finalizing. Clear matched answers remain visible as suggestions.</p><ul>{unmatched.map(({ item, page }, index) => <li key={index}>Page {page} · question {item.number ?? "unknown"}: {item.answer ?? "unreadable"}</li>)}</ul></div>}
      <ReviewWorkspace id={id} items={items} pages={submission.pages.map(({id,pageNumber}) => ({id,pageNumber}))} name={nameReview} score={score} finalized={submission.status === "FINALIZED"} nameReviewed={submission.nameReviewed} reviewBlocked={unmatchedBlocked} />
      <div className={styles.backFooter}><ReviewBackLink id={id} finalized={submission.status === "FINALIZED"} button /></div></div></main>;
  }
}
