import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseQuestion } from "@/lib/question-input";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import QuestionForm from "./question-form";
import DeleteButton from "./delete-button";
import styles from "./quiz-editor.module.css";

export const instant = false;

async function teacherId() {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  return user.id;
}

export default async function QuizEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; edit?: string; section?: string; saved?: string }> }) {
  await connection();
  const { id } = await params;
  const { error, edit, section: editSection, saved } = await searchParams;
  const ownerId = await teacherId();
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: ownerId }, include: { _count: { select: { submissions: true } }, sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } }, answerKey: true, rubricCriteria: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound();
  const locked = quiz._count.submissions > 0;

  async function saveSettings(form: FormData) {
    "use server";
    const teacher = await teacherId();
    const paperSize = String(form.get("paperSize"));
    const numbering = String(form.get("numbering"));
    if (!["A4", "LETTER", "LONG"].includes(paperSize) || !["CONTINUOUS", "RESET_PER_SECTION"].includes(numbering)) redirect(`/quizzes/${id}?error=settings`);
    await db.$transaction(async tx => {
      const owned = await tx.quiz.findFirst({ where: { id, teacherId: teacher }, include: { _count: { select: { submissions: true } } } });
      if (!owned || owned._count.submissions) throw new Error("Quiz is unavailable or locked.");
      await tx.quiz.update({ where: { id }, data: { paperSize, numbering } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=settings`);
  }

  async function addSection(form: FormData) {
    "use server";
    const teacher = await teacherId();
    const title = String(form.get("title") ?? "").trim();
    const instructions = String(form.get("instructions") ?? "").trim();
    const rawPoints = String(form.get("defaultPoints") ?? "").trim();
    const defaultPoints = Number(rawPoints);
    if (!title || title.length > 120 || instructions.length > 2000 || !/^\d+(\.\d{1,2})?$/.test(rawPoints) || defaultPoints <= 0 || defaultPoints > 9999) redirect(`/quizzes/${id}?error=section`);
    await db.$transaction(async tx => {
      const owned = await tx.quiz.findFirst({ where: { id, teacherId: teacher }, include: { _count: { select: { submissions: true } } } });
      if (!owned || owned._count.submissions) throw new Error("Quiz is unavailable or locked.");
      const last = await tx.quizSection.aggregate({ where: { quizId: id }, _max: { position: true } });
      await tx.quizSection.create({ data: { quizId: id, title, instructions, defaultPoints, position: (last._max.position ?? -1) + 1 } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=section`);
  }

  async function addQuestion(sectionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const input = parseQuestion(form);
    if (!input) redirect(`/quizzes/${id}?error=question`);
    await db.$transaction(async tx => {
      const section = await tx.quizSection.findFirst({ where: { id: sectionId, quizId: id, quiz: { teacherId: teacher } }, include: { quiz: { include: { _count: { select: { submissions: true } } } } } });
      if (!section || section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      const last = await tx.question.aggregate({ where: { sectionId }, _max: { position: true } });
      await tx.question.create({ data: { sectionId, type: input.type, text: input.text, points: input.points, position: (last._max.position ?? -1) + 1, besideNext: input.besideNext, essayLineCount: input.essayLineCount,
        ...(input.type === "MULTIPLE_CHOICE" ? { choices: { create: input.choices.map((choice, position) => ({ ...choice, position })) } } : {}),
        ...(input.type !== "ESSAY" ? { answerKey: { create: { acceptedAnswers: input.acceptedAnswers } } } : { rubricCriteria: { create: input.criteria.map((criterion, position) => ({ ...criterion, position })) } }),
      } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=question`);
  }

  async function changeSection(sectionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const title = String(form.get("title") ?? "").trim();
    const instructions = String(form.get("instructions") ?? "").trim();
    const raw = String(form.get("defaultPoints") ?? "").trim();
    if (!title || title.length > 120 || instructions.length > 2000 || !/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 9999) redirect(`/quizzes/${id}?error=section`);
    await db.$transaction(async tx => {
      const section = await tx.quizSection.findFirst({ where: { id: sectionId, quizId: id, quiz: { teacherId: teacher } }, include: { quiz: { include: { _count: { select: { submissions: true } } } } } });
      if (!section || section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      await tx.quizSection.update({ where: { id: sectionId }, data: { title, instructions, defaultPoints: Number(raw) } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=section`);
  }

  async function changeQuestion(questionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const input = parseQuestion(form);
    if (!input) redirect(`/quizzes/${id}?edit=${encodeURIComponent(questionId)}&error=question`);
    await db.$transaction(async tx => {
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: id, quiz: { teacherId: teacher } } }, include: { section: { include: { quiz: { include: { _count: { select: { submissions: true } } } } } } } });
      if (!question || question.section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      await tx.questionChoice.deleteMany({ where: { questionId } });
      await tx.rubricCriterion.deleteMany({ where: { questionId } });
      if (input.type === "ESSAY") await tx.answerKey.deleteMany({ where: { questionId } });
      await tx.question.update({ where: { id: questionId }, data: { type: input.type, text: input.text, points: input.points, besideNext: input.besideNext, essayLineCount: input.essayLineCount,
        ...(input.type === "MULTIPLE_CHOICE" ? { choices: { create: input.choices.map((choice, position) => ({ ...choice, position })) } } : {}),
        ...(input.type !== "ESSAY" ? { answerKey: { upsert: { create: { acceptedAnswers: input.acceptedAnswers }, update: { acceptedAnswers: input.acceptedAnswers } } } } : { rubricCriteria: { create: input.criteria.map((criterion, position) => ({ ...criterion, position })) } }),
      } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=question`);
  }

  async function removeItem(kind: "section" | "question", itemId: string) {
    "use server";
    const teacher = await teacherId();
    await db.$transaction(async tx => {
      const owned = await tx.quiz.findFirst({ where: { id, teacherId: teacher }, include: { _count: { select: { submissions: true } } } });
      if (!owned || owned._count.submissions) throw new Error("Quiz is unavailable or locked.");
      if (kind === "section") await tx.quizSection.deleteMany({ where: { id: itemId, quizId: id } });
      else await tx.question.deleteMany({ where: { id: itemId, section: { quizId: id } } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=deleted`);
  }

  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link className={styles.back} href="/dashboard">← Dashboard</Link></header><div className={styles.content}>
    <p className={styles.eyebrow}>QUIZ EDITOR / DRAFT</p><h1>{quiz.title}</h1><p className={styles.description}>Use the save buttons to keep each section and question.</p><Link className={styles.previewLink} href={`/quizzes/${id}/print`}>Preview &amp; print ↗</Link>
    {saved && <p className={styles.saved} role="status">{saved === "deleted" ? "Deleted successfully." : "Saved successfully."}</p>}
    {locked && <p className={styles.notice}>This quiz has submissions, so its questions and sections are locked.</p>}
    {error && <p className={styles.error} role="alert">{error === "section" ? "Check the section title and default points, then try again." : "Check the question, answer, points, and rubric (if applicable), then try again."}</p>}
    {!locked && <section className={styles.section}><form action={saveSettings} className={styles.form}><h2>Print settings</h2><label>Paper size<select name="paperSize" defaultValue={quiz.paperSize}><option value="A4">A4 · 210 × 297 mm</option><option value="LETTER">Short bond / Letter · 8.5 × 11 in</option><option value="LONG">Long bond · 8.5 × 13 in</option></select></label><label>Question numbering<select name="numbering" defaultValue={quiz.numbering}><option value="CONTINUOUS">Continue across sections</option><option value="RESET_PER_SECTION">Restart for each section</option></select></label><button className={styles.primary}>Save settings</button></form></section>}
    {quiz.sections.map((section, index) => <section key={section.id} className={styles.section}><div className={styles.sectionHeader}><p className={styles.eyebrow}>SECTION {String(index + 1).padStart(2, "0")}</p><h2>{section.title}</h2><p>{section.instructions}</p><small>Default: {section.defaultPoints.toString()} points per question</small>{!locked && <div className={styles.actions}><Link href={`/quizzes/${id}?section=${section.id}`}>Edit section</Link><form action={removeItem.bind(null, "section", section.id)}><DeleteButton label="section" /></form></div>}</div>
      {editSection === section.id && !locked && <form action={changeSection.bind(null, section.id)} className={styles.form}><h3>Edit section</h3><label>Section title<input name="title" required maxLength={120} defaultValue={section.title} /></label><label>Instructions<textarea name="instructions" rows={2} maxLength={2000} defaultValue={section.instructions} /></label><label>Default points per question<input type="number" name="defaultPoints" min="0.01" max="9999" step="0.01" defaultValue={section.defaultPoints.toString()} required /></label><button className={styles.primary}>Save section</button></form>}
      {section.questions.map((question, i) => <article className={styles.question} key={question.id}><div className={styles.questionTop}><span>{String(i + 1).padStart(2, "0")} / {question.type.replaceAll("_", " ")}</span><span>{question.points.toString()} pts</span></div><p>{question.text}</p>{question.choices.length > 0 && <ul>{question.choices.map(choice => <li key={choice.id}>{choice.label}. {choice.text}</li>)}</ul>}{question.answerKey && <small>Answer: {question.answerKey.acceptedAnswers.join(", ")}</small>}{question.rubricCriteria.length > 0 && <small>Rubric: {question.rubricCriteria.map(c => `${c.title} (${c.maxPoints})`).join(", ")}</small>}{question.besideNext && <small>Side by side with next question</small>}{!locked && <div className={styles.actions}><Link href={`/quizzes/${id}?edit=${question.id}`}>Edit question</Link><form action={removeItem.bind(null, "question", question.id)}><DeleteButton label="question" /></form></div>}{edit === question.id && !locked && <QuestionForm action={changeQuestion.bind(null, question.id)} defaultPoints={section.defaultPoints.toString()} initial={{ type: question.type, text: question.text, points: question.points.toString(), choices: question.choices.map(c => ({ label: c.label, text: c.text })), answers: question.answerKey?.acceptedAnswers ?? [], rubric: question.rubricCriteria.map(c => `${c.title} | ${c.description} | ${c.maxPoints}`).join("\n"), lines: question.essayLineCount ?? 7, besideNext: question.besideNext }} />}</article>)}
      {!locked && <QuestionForm action={addQuestion.bind(null, section.id)} defaultPoints={section.defaultPoints.toString()} />}</section>)}
    {!locked && <section className={styles.section}><form action={addSection} className={styles.form}><p className={styles.eyebrow}>BUILD YOUR QUIZ</p><h2>Add a section</h2><label>Section title<input name="title" required maxLength={120} placeholder="e.g. Multiple Choice" /></label><label>Instructions<textarea name="instructions" rows={2} maxLength={2000} placeholder="e.g. Encircle the letter of the correct answer." /></label><label>Default points per question<input type="number" name="defaultPoints" min="0.01" max="9999" step="0.01" defaultValue="1" required /></label><button className={styles.primary} type="submit">Add section</button></form></section>}
    <Link className={styles.previewLink} href="/dashboard">Done · Back to dashboard</Link>
  </div></main>;
}
