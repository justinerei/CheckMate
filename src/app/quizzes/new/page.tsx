import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validQuizTitle } from "@/lib/quiz-title";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import QuizBackLink from "./quiz-back-link";
import styles from "../../dashboard/dashboard.module.css";

export const instant = false;

export default async function NewQuiz() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");

  async function createQuiz(form: FormData) {
    "use server";
    const currentSession = await auth();
    const currentUser = currentSession?.user?.id ? await db.user.findUnique({ where: { googleId: currentSession.user.id } }) : null;
    if (!currentUser?.enabled || currentUser.role !== "TEACHER") redirect("/");
    const title = validQuizTitle(form.get("title"));
    if (!title) redirect("/quizzes/new?error=title");
    const quiz = await db.quiz.create({ data: { title, teacherId: currentUser.id } });
    redirect(`/quizzes/${quiz.id}/configure`);
  }
  return <main className={styles.shell}><header className={styles.header}><Link className={styles.logo} href="/dashboard">checkmate<span>.</span></Link></header><div className={styles.formWrap}>
    <QuizBackLink /><p className={styles.eyebrow}>NEW QUIZ <span>✳</span></p><h1>Start with a title.</h1><p className={styles.formDescription}>Create a draft, then add your sections and questions.</p>
    <form action={createQuiz} className={styles.form}><label htmlFor="title">Quiz title</label><input id="title" name="title" placeholder="e.g. Biology Quiz 1" required maxLength={120} /><p>Give your quiz a name you’ll recognize later.</p><button className={styles.primary} type="submit">Create draft <span>↗</span></button></form>
  </div></main>;
}
