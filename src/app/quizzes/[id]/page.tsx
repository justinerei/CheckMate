import { auth } from "@/auth";
import { db } from "@/lib/db";
import { moduleSummary, validateModulePages } from "@/lib/module-content";
import { parseAdditionalSection, questionIsComplete } from "@/lib/quiz-outline";
import { parseQuestion } from "@/lib/question-input";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import QuestionForm from "./question-form";
import DeleteButton from "./delete-button";
import SaveNotice from "./save-notice";
import SectionOrder from "./section-order";
import ModuleWorkshop from "./module-workshop";
import SubmitButton from "./submit-button";
import InstructionField from "./instruction-field";
import NewSectionFields from "./new-section-fields";
import CancelSectionButton from "./cancel-section-button";
import SectionRubricFields from "./section-rubric-fields";
import QuickSectionPoints from "./quick-section-points";
import { parseSharedRubric, rubricFormValue, sectionRubric } from "@/lib/section-rubric";
import { applySectionPoints } from "@/lib/section-points";
import { validQuestionLayout } from "@/lib/standard-quiz-layout";
import styles from "./quiz-editor.module.css";
import FocusedQuestions from "./focused-questions";
import SectionPointsDialog from "./section-points-dialog";
import { questionNavigation } from "@/lib/question-navigation";
import { questionFormRevision } from "@/lib/question-form-revision";

export const instant = false;
function noticeId() { return Date.now(); }

async function teacherId() {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  return user.id;
}

export default async function QuizEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; edit?: string; section?: string; saved?: string; notice?: string; pointsSection?: string }> }) {
  await connection();
  const { id } = await params;
  const { error, edit, section: editSection, saved, notice, pointsSection } = await searchParams;
  const ownerId = await teacherId();
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: ownerId }, include: { _count: { select: { submissions: true } }, modules: { orderBy: { createdAt: "asc" } }, sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } }, answerKey: true, rubricCriteria: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound();
  const locked = quiz._count.submissions > 0;
  const allQuestions = quiz.sections.flatMap(section => section.questions);
  const incomplete = allQuestions.filter(question => !questionIsComplete(question)).length;
  const navigation = questionNavigation(quiz.sections.map(section => ({ id: section.id, title: section.title, questions: section.questions.map(question => ({ id: question.id, complete: questionIsComplete(question) })) })), quiz.numbering);
  const moduleSummaries = quiz.modules.flatMap(module => { const pages = validateModulePages(module.pages); return pages ? [moduleSummary({ id: module.id, name: module.name, pages })] : []; });
  let globalNumber = 0;
  const generatorSections = quiz.sections.map(section => ({ id: section.id, title: section.title, questions: section.questions.map((question, index) => ({ id: question.id, type: question.type, number: quiz.numbering === "CONTINUOUS" ? ++globalNumber : index + 1, points: question.points.toString(), text: question.text, rubric: question.rubricCriteria.map(c => ({ title: c.title, description: c.description, points: c.maxPoints.toString() })) })) }));
  const outlineLabels: Record<string, string> = { MULTIPLE_CHOICE: "Multiple Choice", IDENTIFICATION: "Identification", TRUE_FALSE: "True or False", ESSAY: "Essay" };
  const canConfigure = !locked && quiz.sections.every(section => section.questions.length > 0 && section.questionLayout === "CUSTOM" && !section.instructions.trim() && Number(section.defaultPoints) === 1 && section.title === outlineLabels[section.questions[0].type] && section.questions.every(question => !question.text.trim() && question.type === section.questions[0].type));

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

  async function saveInstructions(form: FormData) {
    "use server";
    const teacher = await teacherId();
    const generalInstructions = String(form.get("generalInstructions") ?? "").trim();
    if (generalInstructions.length > 2000) redirect(`/quizzes/${id}?error=instructions`);
    await db.$transaction(async tx => {
      const owned = await tx.quiz.findFirst({ where: { id, teacherId: teacher }, include: { _count: { select: { submissions: true } } } });
      if (!owned || owned._count.submissions) throw new Error("Quiz is unavailable or locked.");
      await tx.quiz.update({ where: { id }, data: { generalInstructions } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=instructions&notice=${noticeId()}`);
  }

  async function addSection(form: FormData) {
    "use server";
    const teacher = await teacherId();
    const title = String(form.get("title") ?? "").trim();
    const instructions = String(form.get("instructions") ?? "").trim();
    const rawPoints = String(form.get("defaultPoints") ?? "").trim();
    const defaultPoints = Number(rawPoints);
    if (!title || title.length > 120 || instructions.length > 2000 || !/^\d+(\.\d{1,2})?$/.test(rawPoints) || defaultPoints <= 0 || defaultPoints > 9999) redirect(`/quizzes/${id}?error=section`);
    const added = await db.$transaction(async tx => {
      const owned = await tx.quiz.findFirst({ where: { id, teacherId: teacher }, include: { _count: { select: { submissions: true } } } });
      if (!owned || owned._count.submissions) return false;
      const count = await tx.question.count({ where: { section: { quizId: id } } });
      const plan = parseAdditionalSection(form.get("questionType"), form.get("questionCount"), count);
      if (!plan) return false;
      const layout = plan.type === "MULTIPLE_CHOICE" ? form.get("questionLayout") : "CUSTOM";
      if (!validQuestionLayout(layout)) return false;
      const last = await tx.quizSection.aggregate({ where: { quizId: id }, _max: { position: true } });
      await tx.quizSection.create({ data: { quizId: id, title, instructions, defaultPoints, questionLayout: layout, answerStyle: plan.type === "MULTIPLE_CHOICE" ? "circle" : "written", position: (last._max.position ?? -1) + 1, questions: { create: Array.from({ length: plan.count }, (_, position) => ({ position, type: plan.type, text: "", points: defaultPoints, essayLineCount: plan.type === "ESSAY" ? 7 : null })) } } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!added) redirect(`/quizzes/${id}?error=section`);
    redirect(`/quizzes/${id}?saved=section&notice=${noticeId()}`);
  }

  async function addQuestion(sectionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const input = parseQuestion(form);
    if (!input) redirect(`/quizzes/${id}?error=question`);
    await db.$transaction(async tx => {
      const section = await tx.quizSection.findFirst({ where: { id: sectionId, quizId: id, quiz: { teacherId: teacher } }, include: { questions: { include: { rubricCriteria: { orderBy: { position: "asc" } } } }, quiz: { include: { _count: { select: { submissions: true } } } } } });
      if (!section || section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      if (input.type === "ESSAY" && section.questions.some(q => q.type === "ESSAY")) {
        const shared = sectionRubric(section.questions, Number(section.defaultPoints));
        if (shared.differs || JSON.stringify(shared.criteria) !== JSON.stringify(input.criteria)) throw new Error("The section rubric has changed. Edit the section first.");
      }
      const last = await tx.question.aggregate({ where: { sectionId }, _max: { position: true } });
      await tx.question.create({ data: { sectionId, type: input.type, text: input.text, points: input.points, position: (last._max.position ?? -1) + 1, besideNext: input.besideNext, essayLineCount: input.essayLineCount,
        ...(input.type === "MULTIPLE_CHOICE" ? { choices: { create: input.choices.map((choice, position) => ({ ...choice, position })) } } : {}),
        ...(input.type !== "ESSAY" ? { answerKey: { create: { acceptedAnswers: input.acceptedAnswers } } } : { rubricCriteria: { create: input.criteria.map((criterion, position) => ({ ...criterion, position })) } }),
      } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=question&notice=${noticeId()}#section-${sectionId}`);
  }

  async function changeSectionPoints(sectionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const raw = String(form.get("points") ?? "").trim();
    if (!/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 9999) redirect(`/quizzes/${id}?error=points&pointsSection=${encodeURIComponent(sectionId)}#section-${sectionId}`);
    await db.$transaction(async tx => {
      const section = await tx.quizSection.findFirst({ where: { id: sectionId, quizId: id, quiz: { teacherId: teacher } }, include: { quiz: { include: { _count: { select: { submissions: true } } } } } });
      if (!section || section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      await tx.quizSection.update({ where: { id: sectionId }, data: { defaultPoints: Number(raw) } });
      await applySectionPoints(tx, sectionId, Number(raw));
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=points&notice=${noticeId()}#section-${sectionId}`);
  }

  async function changeSection(sectionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const title = String(form.get("title") ?? "").trim();
    const instructions = String(form.get("instructions") ?? "").trim();
    const layout = form.get("questionLayout");
    if (layout !== null && !validQuestionLayout(layout)) redirect(`/quizzes/${id}?error=section`);
    if (!title || title.length > 120 || instructions.length > 2000) redirect(`/quizzes/${id}?error=section`);
    await db.$transaction(async tx => {
      const section = await tx.quizSection.findFirst({ where: { id: sectionId, quizId: id, quiz: { teacherId: teacher } }, include: { questions: { select: { type: true } }, quiz: { include: { _count: { select: { submissions: true } } } } } });
      if (!section || section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      if (layout !== null && (!section.questions.length || section.questions.some(question => question.type !== "MULTIPLE_CHOICE"))) throw new Error("Layout presets require a multiple-choice section.");
      await tx.quizSection.update({ where: { id: sectionId }, data: { title, instructions, ...(typeof layout === "string" ? { questionLayout: layout } : {}) } });
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=section&notice=${noticeId()}#section-${sectionId}`);
  }

  async function changeSectionRubric(sectionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const criteria = parseSharedRubric(form.get("sharedRubric"));
    if (!criteria) redirect(`/quizzes/${id}?section=${encodeURIComponent(sectionId)}&error=rubric#section-${sectionId}`);
    await db.$transaction(async tx => {
      const section = await tx.quizSection.findFirst({ where: { id: sectionId, quizId: id, quiz: { teacherId: teacher } }, include: { questions: { include: { rubricCriteria: { orderBy: { position: "asc" } } } }, quiz: { include: { _count: { select: { submissions: true } } } } } });
      if (!section || section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      if (sectionRubric(section.questions, Number(section.defaultPoints)).differs && form.get("replaceDifferentRubrics") !== "on") throw new Error("Confirm replacement of different rubrics.");
      const total = Math.round(criteria.reduce((sum, c) => sum + c.maxPoints, 0) * 100) / 100;
      for (const question of section.questions.filter(q => q.type === "ESSAY")) {
        await tx.rubricCriterion.deleteMany({ where: { questionId: question.id } });
        await tx.question.update({ where: { id: question.id }, data: { points: total, rubricCriteria: { create: criteria.map((criterion, position) => ({ ...criterion, position })) } } });
      }
    }, { isolationLevel: "Serializable" });
    redirect(`/quizzes/${id}?saved=rubric&notice=${noticeId()}#section-${sectionId}`);
  }

  async function changeQuestion(questionId: string, form: FormData) {
    "use server";
    const teacher = await teacherId();
    const input = parseQuestion(form);
    if (!input) redirect(`/quizzes/${id}?edit=${encodeURIComponent(questionId)}&error=question`);
    await db.$transaction(async tx => {
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: id, quiz: { teacherId: teacher } } }, include: { section: { include: { questions: { include: { rubricCriteria: { orderBy: { position: "asc" } } } }, quiz: { include: { _count: { select: { submissions: true } } } } } } } });
      if (!question || question.section.quiz._count.submissions) throw new Error("Quiz is unavailable or locked.");
      if (input.type === "ESSAY") {
        const shared = sectionRubric(question.section.questions, Number(question.section.defaultPoints));
        if (shared.differs || JSON.stringify(shared.criteria) !== JSON.stringify(input.criteria)) throw new Error("The section rubric has changed. Edit the section first.");
      }
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

  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link className="back-navigation" href={`/quizzes/${encodeURIComponent(id)}/overview`}>Back to quiz</Link></header><div className={styles.content}>
    <div className={styles.hero}><div><h1>{quiz.title}</h1><p className={styles.description}>Add sections, then add questions to each section. Save each form as you go.</p></div><Link className={styles.previewLink} href={`/quizzes/${encodeURIComponent(id)}/print?from=editor`}>Preview &amp; print ↗</Link></div>
    {saved && <SaveNotice key={`${saved}-${notice}`} message={saved === "order" ? "Section order saved." : saved === "outline" ? "Outline saved. Fill in each question below." : saved === "deleted" ? "Deleted successfully." : saved === "instructions" ? "General instructions saved." : saved === "settings" ? "Print settings saved." : saved === "rubric" ? "Essay rubric saved." : saved === "points" ? "Section points saved." : saved === "section" ? "Section saved." : "Question saved."} />}
    <nav className={styles.steps} aria-label="Quiz creation steps">{canConfigure ? <Link href={`/quizzes/${encodeURIComponent(id)}/configure`}>Outline</Link> : <span>Outline</span>}<span aria-current="step">Questions</span><Link href={`/quizzes/${encodeURIComponent(id)}/print?from=editor`}>Review &amp; print</Link></nav>
    <div className={styles.editorLayout}>
    {!locked && allQuestions.length > 0 && <FocusedQuestions sections={navigation} initialId={edit}>{quiz.sections.flatMap((section, sectionIndex) => section.questions.map((question, questionIndex) => {
      const shared = sectionRubric(section.questions, Number(section.defaultPoints));
      const number = navigation[sectionIndex].questions[questionIndex].number;
      const revision = questionFormRevision({ id: question.id, type: question.type, text: question.text, points: question.points.toString(), choices: question.choices.map(c => ({ label: c.label, text: c.text })), answers: question.answerKey?.acceptedAnswers ?? [], rubric: question.rubricCriteria.map(c => ({ title: c.title, description: c.description, points: c.maxPoints.toString() })), lines: question.essayLineCount ?? 7, besideNext: question.besideNext });
      return <article className={styles.focusedCard} key={question.id} id={`question-${question.id}`}><div className={styles.focusedHeader}><div className={styles.focusedTitleRow}><h2>Question {number}</h2><form action={removeItem.bind(null, "question", question.id)}><DeleteButton label="question" /></form></div><p>{question.type.replaceAll("_", " ")} · {section.title}</p>{error === "question" && edit === question.id && <p className={styles.fieldError} role="alert">Check the question, answer, points, and rubric, then try again.</p>}</div>{question.type === "ESSAY" && shared.differs ? <p className={styles.fieldError}>These essay rubrics differ. Open section management and choose a shared rubric before editing this question.</p> : <QuestionForm key={revision} layoutPreset={section.questionLayout} questionId={question.id} sharedRubric={!shared.differs ? rubricFormValue(shared.criteria) : undefined} action={changeQuestion.bind(null, question.id)} cancelHref={`/quizzes/${id}?edit=${question.id}#question-${question.id}`} defaultPoints={section.defaultPoints.toString()} initial={{ type: question.type, text: question.text, points: question.points.toString(), choices: question.choices.map(c => ({ label: c.label, text: c.text })), answers: question.answerKey?.acceptedAnswers ?? [], rubric: question.rubricCriteria.map(c => `${c.title} | ${c.description} | ${c.maxPoints}`).join("\n"), lines: question.essayLineCount ?? 7, besideNext: question.besideNext }} />}</article>;
    }))}</FocusedQuestions>}

      <aside className={styles.editorSidebar} aria-label="Quiz tools" tabIndex={0}>
        <h2 className={styles.sidebarHeading}>Quiz tools</h2>
    {!locked && <p className={styles.notice}>{incomplete ? `${incomplete} ${incomplete === 1 ? "question needs" : "questions need"} details before preview and checking.` : allQuestions.length ? "All questions are ready for preview." : "Add questions before preview and checking."}</p>}
    {locked && <div className={`${styles.notice} ${styles.lockedNotice}`}><div><strong>Questions and sections are locked</strong><p>This quiz already has student papers. You can still correct answers; affected finalized scores will update.</p></div><Link className={styles.keyCorrectionLink} href={`/quizzes/existing/${encodeURIComponent(id)}/edit?from=editor`}>Edit correct answers →</Link></div>}
    {error && <p className={styles.error} role="alert">{error === "points" ? "Enter points from 0.01 to 9999, with up to two decimal places." : error === "incomplete" ? "Complete every question, answer, and essay rubric before previewing or checking." : error === "section" ? "Check the section details and question count. A quiz can have up to 200 questions in its outline." : "Check the question, answer, points, and rubric (if applicable), then try again."}</p>}
      <section className={styles.toolGroup} aria-labelledby="section-tools-heading"><h3 id="section-tools-heading">Sections</h3>
    {!locked && <SectionPointsDialog openOnError={error === "points"}>{quiz.sections.length ? quiz.sections.map(section => <section className={styles.pointsSection} key={section.id}><h3>{section.title}</h3>{section.questions.some(q => q.type !== "ESSAY") && <QuickSectionPoints key={`${section.id}:${section.defaultPoints}:${section.questions.map(q => q.points.toString()).join(",")}`} sectionId={section.id} defaultPoints={section.defaultPoints.toString()} questions={section.questions.map(q => ({ type: q.type, points: q.points.toString() }))} action={changeSectionPoints.bind(null, section.id)} error={error === "points" && pointsSection === section.id} />}{section.questions.some(q => q.type === "ESSAY") && <Link data-close-points-dialog className={styles.rubricShortcut} href={`/quizzes/${id}?section=${section.id}#rubric-${section.id}`}>Edit essay rubric &amp; points →</Link>}{!section.questions.length && <small>No questions in this section yet.</small>}</section>) : <p>Add a section before setting points.</p>}</SectionPointsDialog>}
      <details className={styles.management} open={locked || !allQuestions.length || Boolean(editSection) || error === "points" || error === "rubric" || undefined}><summary>More section settings</summary><div className={styles.editorMain} role="region" aria-label="Sections and questions" tabIndex={0}>
    <div className={styles.sectionListHeading}><div><h2>Sections &amp; questions</h2></div><div className={styles.sectionHeadingActions}><span>{quiz.sections.length} {quiz.sections.length === 1 ? "section" : "sections"}</span>{canConfigure && <Link className={styles.outlineAction} href={`/quizzes/${encodeURIComponent(id)}/configure`}>{quiz.sections.length ? "Edit outline" : "Plan outline"}</Link>}</div></div>
    {quiz.sections.length > 1 && <nav className={styles.sectionJump} aria-label="Jump to section"><span>Jump to:</span>{quiz.sections.map((section, index) => <a key={section.id} href={`#section-${section.id}`}>{index + 1}. {section.title}</a>)}</nav>}
    {quiz.sections.map((section, index) => <section id={`section-${section.id}`} key={section.id} className={styles.section}><div className={styles.sectionHeader}><p className={styles.eyebrow}>SECTION {String(index + 1).padStart(2, "0")} · {section.questions.length} {section.questions.length === 1 ? "QUESTION" : "QUESTIONS"}</p><h2>{section.title}</h2><p>{section.instructions}</p>{!locked && section.questions.some(q => q.type === "ESSAY") && <Link className={styles.rubricShortcut} href={`/quizzes/${id}?section=${section.id}#section-${section.id}`}>Edit essay rubric &amp; points →</Link>}{!locked && <div className={styles.actions}><Link href={`/quizzes/${id}?section=${section.id}#section-${section.id}`}>Edit section</Link><form action={removeItem.bind(null, "section", section.id)}><DeleteButton label="section" /></form></div>}</div>
      {editSection === section.id && !locked && <><form action={changeSection.bind(null, section.id)} className={styles.form}><h3>Edit section</h3><label>Section title<input name="title" required maxLength={120} defaultValue={section.title} /></label><InstructionField initial={section.instructions} kind={section.questions.length && section.questions.every(question => question.type === section.questions[0].type) ? section.questions[0].type : "mixed"} />{section.questions.length > 0 && section.questions.every(question => question.type === "MULTIPLE_CHOICE") && <label>Question layout<select name="questionLayout" defaultValue={section.questionLayout}><option value="SINGLE_COLUMN">One column</option><option value="TWO_COLUMN">Two columns</option><option value="CUSTOM">Custom per question</option></select><small>Choose once for the entire section, including questions added later.</small></label>}<div className={styles.formActions}><SubmitButton>Save section details</SubmitButton><Link href={`/quizzes/${id}#section-${section.id}`}>Cancel</Link></div></form>{section.questions.some(q => q.type === "ESSAY") && <form id={`rubric-${section.id}`} action={changeSectionRubric.bind(null, section.id)} className={styles.form}><SectionRubricFields initial={sectionRubric(section.questions, Number(section.defaultPoints)).criteria.map(c => ({ title: c.title, description: c.description, points: String(c.maxPoints) }))} differs={sectionRubric(section.questions, Number(section.defaultPoints)).differs} />{error === "rubric" && <p className={styles.fieldError} role="alert">Check each criterion and its points, then try again.</p>}<div className={styles.formActions}><SubmitButton>Save essay rubric</SubmitButton></div></form>}</>}
      {locked && section.questions.map((question, i) => <article className={styles.question} id={locked ? `question-${question.id}` : `manage-question-${question.id}`} key={question.id}><div className={styles.questionTop}><span>{String((quiz.numbering === "CONTINUOUS" ? quiz.sections.slice(0, index).reduce((sum, previous) => sum + previous.questions.length, 0) : 0) + i + 1).padStart(2, "0")} / {question.type.replaceAll("_", " ")}</span><span>{question.points.toString()} pts</span></div><p>{question.text || "Question not filled in yet"}</p>{!questionIsComplete(question) && <small>Needs question and answer details</small>}{question.choices.length > 0 && <ul>{question.choices.map(choice => <li key={choice.id}>{choice.label}. {choice.text}</li>)}</ul>}{question.sourceModuleName && question.sourcePage && <small>Suggested source: {question.sourceModuleName} · page {question.sourcePage}</small>}{question.answerKey && <small>Answer: {question.answerKey.acceptedAnswers.join(", ")}</small>}{locked && question.answerKey && <Link className={styles.correctAnswerLink} href={`/quizzes/existing/${encodeURIComponent(id)}/edit?from=editor#question-${encodeURIComponent(question.id)}`}>Correct this answer →</Link>}{question.rubricCriteria.length > 0 && <small>Rubric: {question.rubricCriteria.map(c => `${c.title} (${c.maxPoints})`).join(", ")}</small>}{question.besideNext && <small>Side by side with next question</small>}{!locked && <div className={`${styles.actions} ${styles.questionActions}`}><Link href={`/quizzes/${id}?edit=${question.id}#question-${question.id}`}>{question.text ? "Edit question" : "Fill in question"}</Link><form action={removeItem.bind(null, "question", question.id)}><DeleteButton label="question" /></form></div>}</article>)}
      {!locked && sectionRubric(section.questions, Number(section.defaultPoints)).differs && <p className={styles.fieldError}>Set a shared essay rubric in Edit section before adding questions.</p>}{!locked && !sectionRubric(section.questions, Number(section.defaultPoints)).differs && <details className={styles.disclosure}><summary>＋ Add question</summary><QuestionForm layoutPreset={section.questionLayout} sharedRubric={!sectionRubric(section.questions, Number(section.defaultPoints)).differs ? rubricFormValue(sectionRubric(section.questions, Number(section.defaultPoints)).criteria) : undefined} action={addQuestion.bind(null, section.id)} cancelHref={`/quizzes/${id}#section-${section.id}`} defaultPoints={section.defaultPoints.toString()} /></details>}</section>)}
    {!locked && <details className={styles.addSection} open={quiz.sections.length === 0 ? true : undefined}><summary>＋ {quiz.sections.length ? "Add another section" : "Add your first section"}</summary><form action={addSection} className={styles.form}><h2>Set up a section</h2><label>Section title<input name="title" required maxLength={120} placeholder="e.g. Multiple Choice" /></label><NewSectionFields questionCount={allQuestions.length} /><label>Default points per question<input type="number" name="defaultPoints" min="0.01" max="9999" step="0.01" defaultValue="1" required /><small>You can change the points for each question.</small></label><div className={styles.formActions}>{allQuestions.length < 200 ? <SubmitButton>Create section and questions</SubmitButton> : <p>A quiz can have up to 200 questions in its outline.</p>}<CancelSectionButton /></div></form></details>}
      </div></details>
    {!locked && quiz.sections.length > 1 && <SectionOrder key={quiz.sections.map(section => section.id).join(":")} quizId={id} initial={quiz.sections.map(section => ({ id: section.id, title: section.title, count: section.questions.length }))} continuous={quiz.numbering === "CONTINUOUS"} />}
      </section>
      {!locked && <section className={styles.toolGroup} aria-labelledby="suggestion-tools-heading"><h3 id="suggestion-tools-heading">Question suggestions</h3>
    {!locked && <ModuleWorkshop key={`${ownerId}:${id}`} teacherId={ownerId} quizId={id} initialModules={moduleSummaries} sections={generatorSections} />}
      </section>}
      {!locked && <section className={styles.toolGroup} aria-labelledby="quiz-settings-heading"><h3 id="quiz-settings-heading">Quiz settings</h3>
    {!locked && <details className={styles.settings}><summary>General instructions <span>{quiz.generalInstructions ? "Added · edit instructions" : "Optional · add instructions for the whole quiz"}</span></summary><form action={saveInstructions} className={styles.form}><InstructionField initial={quiz.generalInstructions} kind="general" /><SubmitButton>Save instructions</SubmitButton></form></details>}
    {!locked && <details className={styles.settings}><summary>Print settings <span>{quiz.paperSize} · {quiz.numbering === "CONTINUOUS" ? "Continuous numbering" : "Restart per section"}</span></summary><form action={saveSettings} className={styles.form}><label>Paper size<select name="paperSize" defaultValue={quiz.paperSize}><option value="A4">A4 · 210 × 297 mm</option><option value="LETTER">Short bond / Letter · 8.5 × 11 in</option><option value="LONG">Long bond · 8.5 × 13 in</option></select></label><label>Question numbering<select name="numbering" defaultValue={quiz.numbering}><option value="CONTINUOUS">Continue across sections</option><option value="RESET_PER_SECTION">Restart for each section</option></select></label><SubmitButton>Save settings</SubmitButton></form></details>}
      </section>}
      </aside>
    </div>
  </div></main>;
}
