import { auth } from "@/auth";
import { db } from "@/lib/db";
import { questionIsComplete } from "@/lib/quiz-outline";
import { parseQuestion } from "@/lib/question-input";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import QuestionForm from "./question-form";
import DeleteButton from "./delete-button";
import SaveNotice from "./save-notice";
import SubmitButton from "./submit-button";
import styles from "./quiz-editor.module.css";

export const instant = false;
function noticeId() { return Date.now(); }

async function teacherId() {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  return user.id;
}

export default async function QuizEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; edit?: string; section?: string; saved?: string; notice?: string }> }) {
  await connection();
  const { id } = await params;
  const { error, edit, section: editSection, saved, notice } = await searchParams;
  const ownerId = await teacherId();
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: ownerId }, include: { _count: { select: { submissions: true } }, sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } }, answerKey: true, rubricCriteria: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound();
  const locked = quiz._count.submissions > 0;
  const allQuestions = quiz.sections.flatMap(section => section.questions);
  const incomplete = allQuestions.filter(question => !questionIsComplete(question)).length;
  const outlineLabels: Record<string, string> = { MULTIPLE_CHOICE: "Multiple Choice", IDENTIFICATION: "Identification", TRUE_FALSE: "True or False", ESSAY: "Essay" };
  const canConfigure = !locked && quiz.sections.every(section => section.questions.length > 0 && !section.instructions.trim() && Number(section.defaultPoints) === 1 && section.title === outlineLabels[section.questions[0].type] && section.questions.every(question => !question.text.trim() && question.type === section.questions[0].type));

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
    redirect(`/quizzes/${id}?saved=settings&notice=${noticeId()}`);
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
    redirect(`/quizzes/${id}?saved=section&notice=${noticeId()}`);
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
    redirect(`/quizzes/${id}?saved=question&notice=${noticeId()}#section-${sectionId}`);
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
    redirect(`/quizzes/${id}?saved=section&notice=${noticeId()}#section-${sectionId}`);
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
    redirect(`/quizzes/${id}?saved=question&notice=${noticeId()}#question-${questionId}`);
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
    redirect(`/quizzes/${id}?saved=deleted&notice=${noticeId()}`);
  }

  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link className={styles.back} href={`/quizzes/${encodeURIComponent(id)}/overview`}>← Back to quiz</Link></header><div className={styles.content}>
    <div className={styles.hero}><div><p className={styles.eyebrow}>QUIZ EDITOR / DRAFT</p><h1>{quiz.title}</h1><p className={styles.description}>Add sections, then add questions to each section. Save each form as you go.</p></div><Link className={styles.previewLink} href={`/quizzes/${id}/print`}>Preview &amp; print ↗</Link></div>
    {saved && <SaveNotice key={`${saved}-${notice}`} message={saved === "outline" ? "Outline saved. Fill in each question below." : saved === "deleted" ? "Deleted successfully." : saved === "settings" ? "Print settings saved." : saved === "section" ? "Section saved." : "Question saved."} />}
    {!locked && <p className={styles.notice}>{incomplete ? `${incomplete} ${incomplete === 1 ? "question needs" : "questions need"} details before preview and checking.` : allQuestions.length ? "All questions are ready for preview." : "Add questions before preview and checking."} {canConfigure && <Link href={`/quizzes/${encodeURIComponent(id)}/configure`}>Edit quiz outline →</Link>}</p>}
    {locked && <p className={styles.notice}>This quiz has submissions, so its questions and sections are locked.</p>}
    {error && <p className={styles.error} role="alert">{error === "incomplete" ? "Complete every question, answer, and essay rubric before previewing or checking." : error === "section" ? "Check the section title and default points, then try again." : "Check the question, answer, points, and rubric (if applicable), then try again."}</p>}
    {!locked && <details className={styles.settings}><summary>Print settings <span>{quiz.paperSize} · {quiz.numbering === "CONTINUOUS" ? "Continuous numbering" : "Restart per section"}</span></summary><form action={saveSettings} className={styles.form}><label>Paper size<select name="paperSize" defaultValue={quiz.paperSize}><option value="A4">A4 · 210 × 297 mm</option><option value="LETTER">Short bond / Letter · 8.5 × 11 in</option><option value="LONG">Long bond · 8.5 × 13 in</option></select></label><label>Question numbering<select name="numbering" defaultValue={quiz.numbering}><option value="CONTINUOUS">Continue across sections</option><option value="RESET_PER_SECTION">Restart for each section</option></select></label><SubmitButton>Save settings</SubmitButton></form></details>}
    <div className={styles.sectionListHeading}><div><p className={styles.eyebrow}>01 / BUILD</p><h2>Sections &amp; questions</h2></div><span>{quiz.sections.length} {quiz.sections.length === 1 ? "section" : "sections"}</span></div>
    {quiz.sections.map((section, index) => <section id={`section-${section.id}`} key={section.id} className={styles.section}><div className={styles.sectionHeader}><p className={styles.eyebrow}>SECTION {String(index + 1).padStart(2, "0")} · {section.questions.length} {section.questions.length === 1 ? "QUESTION" : "QUESTIONS"}</p><h2>{section.title}</h2><p>{section.instructions}</p><small>Default: {section.defaultPoints.toString()} points per question</small>{!locked && <div className={styles.actions}><Link href={`/quizzes/${id}?section=${section.id}#section-${section.id}`}>Edit section</Link><form action={removeItem.bind(null, "section", section.id)}><DeleteButton label="section" /></form></div>}</div>
      {editSection === section.id && !locked && <form action={changeSection.bind(null, section.id)} className={styles.form}><h3>Edit section</h3><label>Section title<input name="title" required maxLength={120} defaultValue={section.title} /></label><label>Instructions<textarea name="instructions" rows={2} maxLength={2000} defaultValue={section.instructions} /><small>For automatic erasure checks, write “No erasures.” as a separate sentence.</small></label><label>Default points per question<input type="number" name="defaultPoints" min="0.01" max="9999" step="0.01" defaultValue={section.defaultPoints.toString()} required /></label><div className={styles.formActions}><SubmitButton>Save section</SubmitButton><Link href={`/quizzes/${id}#section-${section.id}`}>Cancel</Link></div></form>}
      {section.questions.map((question, i) => <article className={styles.question} id={`question-${question.id}`} key={question.id}><div className={styles.questionTop}><span>{String((quiz.numbering === "CONTINUOUS" ? quiz.sections.slice(0, index).reduce((sum, previous) => sum + previous.questions.length, 0) : 0) + i + 1).padStart(2, "0")} / {question.type.replaceAll("_", " ")}</span><span>{question.points.toString()} pts</span></div><p>{question.text || "Question not filled in yet"}</p>{!questionIsComplete(question) && <small>Needs question and answer details</small>}{question.choices.length > 0 && <ul>{question.choices.map(choice => <li key={choice.id}>{choice.label}. {choice.text}</li>)}</ul>}{question.answerKey && <small>Answer: {question.answerKey.acceptedAnswers.join(", ")}</small>}{question.rubricCriteria.length > 0 && <small>Rubric: {question.rubricCriteria.map(c => `${c.title} (${c.maxPoints})`).join(", ")}</small>}{question.besideNext && <small>Side by side with next question</small>}{!locked && <div className={`${styles.actions} ${styles.questionActions}`}><Link href={`/quizzes/${id}?edit=${question.id}#question-${question.id}`}>{question.text ? "Edit question" : "Fill in question"}</Link><form action={removeItem.bind(null, "question", question.id)}><DeleteButton label="question" /></form></div>}{edit === question.id && !locked && <QuestionForm action={changeQuestion.bind(null, question.id)} cancelHref={`/quizzes/${id}#question-${question.id}`} defaultPoints={section.defaultPoints.toString()} initial={{ type: question.type, text: question.text, points: question.points.toString(), choices: question.choices.map(c => ({ label: c.label, text: c.text })), answers: question.answerKey?.acceptedAnswers ?? [], rubric: question.rubricCriteria.map(c => `${c.title} | ${c.description} | ${c.maxPoints}`).join("\n"), lines: question.essayLineCount ?? 7, besideNext: question.besideNext }} />}</article>)}
      {!locked && <details className={styles.disclosure}><summary>＋ Add question</summary><QuestionForm action={addQuestion.bind(null, section.id)} defaultPoints={section.defaultPoints.toString()} /></details>}</section>)}
    {!locked && <details className={styles.addSection} open={quiz.sections.length === 0 ? true : undefined}><summary>＋ {quiz.sections.length ? "Add another section" : "Add your first section"}</summary><form action={addSection} className={styles.form}><p className={styles.eyebrow}>NEW SECTION</p><h2>Set up a section</h2><label>Section title<input name="title" required maxLength={120} placeholder="e.g. Multiple Choice" /></label><label>Instructions <span className={styles.optional}>Optional</span><textarea name="instructions" rows={2} maxLength={2000} placeholder="e.g. Encircle the letter of the correct answer. No erasures." /><small>To automatically mark clearly detected erasures incorrect, write “No erasures.” as a separate sentence in this section’s instructions.</small></label><label>Default points per question<input type="number" name="defaultPoints" min="0.01" max="9999" step="0.01" defaultValue="1" required /><small>You can change the points for each question.</small></label><SubmitButton>Save section</SubmitButton></form></details>}
    <Link className={styles.previewLink} href={`/quizzes/${encodeURIComponent(id)}/overview`}>Done · Back to quiz</Link>
  </div></main>;
}
