import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { releasedStudentResults } from "@/lib/student-portal";
import { studentUser } from "../../student-data";
import StudentShell from "../../student-shell";
import ConcernForm from "./concern-form";
import styles from "../../student-workspace.module.css";

export const instant = false;
export default async function StudentResult({ params }: { params: Promise<{ id: string }> }) {
  await connection(); const user = await studentUser(); const { id } = await params;
  const paper = await db.submission.findFirst({ where: { id, ...releasedStudentResults(user.id) }, include: { student: { select: { id: true } }, concerns: { orderBy: { createdAt: "desc" } }, answers: { include: { assessments: { include: { criterion: true } } } }, quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } } } });
  if (!paper || !paper.student) notFound();
  let continuous = 0;
  const questions = paper.quiz.sections.flatMap(section => section.questions.map((question, index) => ({ ...question, label: paper.quiz.numbering === "CONTINUOUS" ? `Question ${++continuous}` : `${section.title} · Question ${index + 1}` })));
  const max = questions.reduce((sum, question) => sum + Number(question.points), 0);
  const concerns = paper.concerns.filter(concern => concern.studentId === paper.student!.id);
  return <StudentShell email={user.email} active="results"><div className={styles.content}><Link className={styles.link} href="/student/results">← My results</Link><header className={styles.welcome}><h1>{paper.quiz.title}.</h1><p>Score: {paper.totalScore?.toString()} / {Math.round(max * 100) / 100} · Released {paper.releasedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(paper.releasedAt) : ""}</p></header><section className={styles.section} aria-label="Question results">{questions.map(question => { const answer = paper.answers.find(item => item.questionId === question.id); const score = answer?.instructionDecision === "VIOLATION" ? 0 : question.type === "ESSAY" ? answer?.teacherScore : answer?.objectiveScore; const number = score == null ? null : Number(score); return <article className={styles.detailCard} key={question.id}><h2>{question.label}</h2>{question.text.trim() && <p>{question.text}</p>}<p>Recorded answer: <strong>{answer?.confirmedText === "" ? "Blank" : answer?.confirmedText ?? "Not available"}</strong></p><p className={styles.detailScore}>{number === null ? "Score unavailable" : question.type === "ESSAY" ? `Score: ${number} / ${question.points.toString()}` : `${number === Number(question.points) ? "Correct" : number === 0 ? "Incorrect" : "Partial credit"} · ${number} / ${question.points.toString()}`}</p>{answer?.instructionDecision === "VIOLATION" && <p>Marked incorrect for not following the section instructions.</p>}{paper.showCorrectAnswers && question.type !== "ESSAY" && <p>Correct answer: {question.answerKey?.acceptedAnswers.join(" / ") || "Not available"}</p>}{answer?.teacherComment && <p>Teacher comment: {answer.teacherComment}</p>}{answer?.assessments.length ? <><strong>Scoring criteria</strong><ul>{answer.assessments.map(item => <li key={item.id}>{item.criterion.title}: {item.teacherScore?.toString() ?? "—"} / {item.criterion.maxPoints.toString()}{item.teacherFeedback ? ` · ${item.teacherFeedback}` : ""}</li>)}</ul></> : null}</article>; })}</section><section className={styles.section}><h2>Questions for your teacher</h2>{concerns.length ? concerns.map(concern => <div className={styles.detailCard} key={concern.id}><strong>{questions.find(question => question.id === concern.questionId)?.label ?? "Question"} · {concern.resolvedAt ? "Answered" : "Waiting for teacher"}</strong><p>{concern.message}</p>{concern.response && <p>Teacher response: {concern.response}</p>}</div>) : <p>No concerns sent yet.</p>}<ConcernForm id={paper.id} questions={questions.map(({ id, label }) => ({ id, label }))} /></section></div></StudentShell>;
}
