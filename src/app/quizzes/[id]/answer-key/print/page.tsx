import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { answerKeyPrintSections } from "@/lib/answer-key-print";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import PrintButton from "./print-button";
import styles from "./print-key.module.css";

export const instant = false;

export default async function PrintAnswerKey({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const quiz = await db.quiz.findFirst({
    where: { id, teacherId: teacher.id },
    include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true, choices: { orderBy: { position: "asc" } }, rubricCriteria: { orderBy: { position: "asc" } } } } } } },
  });
  if (!quiz) notFound();
  const sections = answerKeyPrintSections(quiz.sections, quiz.numbering);
  const count = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const pageSize = quiz.paperSize === "LETTER" ? "letter" : quiz.paperSize === "LONG" ? "8.5in 13in" : "A4";

  return <main className={styles.preview}>
    <style>{`@page { size: ${pageSize}; margin: 15mm; }`}</style>
    <div className={styles.toolbar}>
      <Link className="back-navigation" href={`/quizzes/${encodeURIComponent(id)}/overview`}>Back to quiz</Link>
      <span>Teacher copy · Current answers</span>
      <PrintButton />
      <p>Print or save this answer key separately from the student quiz. Review it before sharing.</p>
    </div>
    <article className={styles.paper}>
      <header className={styles.header}><p>TEACHER COPY</p><h1>{quiz.title}</h1><h2>Answer key</h2><span>{count} {count === 1 ? "question" : "questions"}</span></header>
      {count === 0 && <p className={styles.empty}>No questions have been added to this quiz yet.</p>}
      {sections.map((section, index) => section.questions.length > 0 && <section className={styles.section} key={section.id}>
        <h3>{index + 1}. {section.title}</h3>
        <ol className={styles.answers}>{section.questions.map(question => <li className={styles.answer} key={question.id}>
          <strong className={styles.answerNumber}>{question.number}.</strong>
          <div className={styles.answerContent}>
            {question.type === "ESSAY" ? <><strong>Teacher-scored essay</strong>{question.rubric.length ? <ul className={styles.rubric}>{question.rubric.map((criterion, i) => <li key={i}><strong>{criterion.title} · {criterion.points} {Number(criterion.points) === 1 ? "point" : "points"}</strong>{criterion.description.trim() && <p>{criterion.description}</p>}</li>)}</ul> : <p className={styles.missing}>No rubric provided.</p>}</> : question.answers.length ? <p className={styles.correct}><strong>Answer:</strong> {question.answers.join(" / ")}</p> : <p className={styles.missing}>Answer not provided.</p>}
          </div>
          <span className={styles.points}>{question.points} {Number(question.points) === 1 ? "point" : "points"}</span>
        </li>)}</ol>
      </section>)}
    </article>
  </main>;
}
