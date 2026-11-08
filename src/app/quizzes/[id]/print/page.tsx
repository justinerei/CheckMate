import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import PrintControls from "./print-controls";
import { quizPrintCode } from "@/lib/print-label";
import styles from "./print.module.css";

export const instant = false;

export default async function PrintQuiz({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: user.id }, include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound();
  const paper = quiz.paperSize === "LETTER" ? { page: "letter", width: "8.5in", height: "11in", label: "Letter" } : quiz.paperSize === "LONG" ? { page: "8.5in 13in", width: "8.5in", height: "13in", label: "Long bond" } : { page: "A4", width: "210mm", height: "297mm", label: "A4" };
  const code = quizPrintCode(quiz.id);
  return <main className={styles.preview}><div className={styles.toolbar}><Link href={`/quizzes/${id}`}>← Back to editor</Link><span>Paper: {paper.label} · Quiz: {code}</span><PrintControls pageSize={paper.page} code={code} /></div><article className={styles.paper} style={{ "--paper-width": paper.width, "--paper-height": paper.height } as React.CSSProperties}>
    <header className={styles.paperHeader}><h1>{quiz.title}</h1><div className={styles.fields}><div>Name: <span /></div><div>Date: <span /></div><div>Section: <span /></div></div></header>
    {quiz.sections.map((section, index) => {
      const start = quiz.numbering === "RESET_PER_SECTION" ? 0 : quiz.sections.slice(0, index).reduce((sum, item) => sum + item.questions.length, 0);
      const rows: typeof section.questions[] = [];
      for (let i = 0; i < section.questions.length; i++) {
        const current = section.questions[i];
        if (current.besideNext && section.questions[i + 1]) rows.push([current, section.questions[++i]]);
        else rows.push([current]);
      }
      return <section className={styles.section} key={section.id}><h2>{index + 1}. {section.title}</h2>{section.instructions && <p className={styles.instructions}>{section.instructions}</p>}{rows.map(row => <div className={row.length === 2 ? styles.pair : styles.row} key={row[0].id}>{row.map(question => {
        const number = start + section.questions.findIndex(item => item.id === question.id) + 1;
        const showBlank = question.type === "TRUE_FALSE" || question.type === "IDENTIFICATION";
        return <div className={styles.question} key={question.id}><div className={styles.prompt}>{showBlank && <span className={question.type === "TRUE_FALSE" ? styles.shortBlank : styles.longBlank} />}<span>{number}. {question.text}</span></div>{question.type === "MULTIPLE_CHOICE" && <div className={styles.choices}>{question.choices.map(choice => <span key={choice.id}>{choice.label}. {choice.text}</span>)}</div>}{question.type === "ESSAY" && <div className={styles.lines}>{Array.from({ length: question.essayLineCount ?? 7 }, (_, n) => <div key={n} />)}</div>}</div>;
      })}</div>)}</section>;
    })}
  </article></main>;
}
