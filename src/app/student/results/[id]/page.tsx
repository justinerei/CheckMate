import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { releasedStudentResults } from "@/lib/student-portal";
import { studentUser } from "../../student-data";
import StudentShell from "../../student-shell";
import ConcernForm from "./concern-form";
import styles from "../../student-workspace.module.css";
import resultStyles from "./result.module.css";

export const instant = false;
export default async function StudentResult({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fromClass?: string }> }) {
  await connection(); const user = await studentUser(); const { id } = await params; const { fromClass } = await searchParams;
  const paper = await db.submission.findFirst({ where: { id, ...releasedStudentResults(user.id) }, include: { student: { select: { id: true } }, concerns: { orderBy: { createdAt: "desc" } }, answers: { include: { assessments: { include: { criterion: true } } } }, quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } } } });
  if (!paper || !paper.student) notFound();
  const fromThisClass = !!fromClass && fromClass === paper.classroomId;
  let continuous = 0;
  const questions = paper.quiz.sections.flatMap(section => section.questions.map((question, index) => ({ ...question, label: paper.quiz.numbering === "CONTINUOUS" ? `Question ${++continuous}` : `${section.title} · Question ${index + 1}` })));
  const max = questions.reduce((sum, question) => sum + Number(question.points), 0);
  const concerns = paper.concerns.filter(concern => concern.studentId === paper.student!.id);
  return <StudentShell user={user} active={fromThisClass ? "classes" : "results"}>
    <div className={styles.content}>
      <Link className={resultStyles.back} href={fromThisClass ? `/student/classes/${encodeURIComponent(fromClass!)}` : "/student/results"}>{fromThisClass ? "← Back to class" : "← My results"}</Link>
      <header className={resultStyles.header}>
        <div><p className={resultStyles.eyebrow}>YOUR RESULT <span>✳</span></p><h1>{paper.quiz.title}</h1><p>Released {paper.releasedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(paper.releasedAt) : ""}</p></div>
        <div className={resultStyles.scoreCard}><span>FINAL SCORE</span><strong>{paper.totalScore?.toString()} <small>/ {Math.round(max * 100) / 100}</small></strong></div>
      </header>
      <section className={resultStyles.answerSection} aria-labelledby="answer-heading">
        <div className={resultStyles.sectionHeading}><div><p className={resultStyles.eyebrow}>01 / YOUR ANSWERS</p><h2 id="answer-heading">Answer breakdown</h2><p>Review your recorded answers and scores.</p></div><span>{questions.length} {questions.length === 1 ? "QUESTION" : "QUESTIONS"}</span></div>
        <div className={resultStyles.answers}>{questions.map(question => {
          const answer = paper.answers.find(item => item.questionId === question.id);
          const score = answer?.instructionDecision === "VIOLATION" ? 0 : question.type === "ESSAY" ? answer?.teacherScore : answer?.objectiveScore;
          const number = score == null ? null : Number(score);
          const status = number === null ? "Score unavailable" : question.type === "ESSAY" ? "Scored" : number === Number(question.points) ? "Correct" : number === 0 ? "Incorrect" : "Partial credit";
          const tone = status === "Correct" ? resultStyles.correct : status === "Incorrect" ? resultStyles.incorrect : resultStyles.neutral;
          return <article className={resultStyles.answer} key={question.id}>
            <div className={resultStyles.answerHeader}><h3>{question.label}</h3><div className={resultStyles.resultMeta}><span className={`${resultStyles.status} ${tone}`}>{status}</span><strong>{number === null ? "—" : number} <span>/ {question.points.toString()}</span></strong></div></div>
            {question.text.trim() && <p className={resultStyles.questionText}>{question.text}</p>}
            <div className={resultStyles.answerFields}><div><span>YOUR ANSWER</span><strong>{answer?.confirmedText === "" ? "Blank" : answer?.confirmedText ?? "Not available"}</strong></div>{paper.showCorrectAnswers && question.type !== "ESSAY" && <div><span>CORRECT ANSWER</span><strong>{question.answerKey?.acceptedAnswers.join(" / ") || "Not available"}</strong></div>}</div>
            {answer?.instructionDecision === "VIOLATION" && <p className={resultStyles.note}>Marked incorrect for not following the section instructions.</p>}
            {answer?.teacherComment && <p className={resultStyles.note}><strong>Teacher comment:</strong> {answer.teacherComment}</p>}
            {!!answer?.assessments.length && <div className={resultStyles.rubric}><strong>Scoring criteria</strong><ul>{answer.assessments.map(item => <li key={item.id}>{item.criterion.title}: {item.teacherScore?.toString() ?? "—"} / {item.criterion.maxPoints.toString()}{item.teacherFeedback ? ` · ${item.teacherFeedback}` : ""}</li>)}</ul></div>}
          </article>;
        })}</div>
      </section>
      <section className={resultStyles.concerns}><p className={resultStyles.eyebrow}>02 / FEEDBACK</p><h2>Questions for your teacher</h2>{concerns.length ? concerns.map(concern => <div className={styles.detailCard} key={concern.id}><strong>{questions.find(question => question.id === concern.questionId)?.label ?? "Question"} · {concern.resolvedAt ? "Answered" : "Waiting for teacher"}</strong><p>{concern.message}</p>{concern.response && <p>Teacher response: {concern.response}</p>}</div>) : <p className={resultStyles.muted}>No concerns sent yet.</p>}<ConcernForm id={paper.id} questions={questions.map(({ id, label }) => ({ id, label }))} /></section>
    </div>
  </StudentShell>;
}
