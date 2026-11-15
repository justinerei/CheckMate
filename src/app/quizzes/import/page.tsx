import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacher } from "@/lib/teacher";
import ImportQuizForm from "./import-form";
import styles from "../../submissions/submissions.module.css";

export const instant = false;
export default async function ImportQuizPage() {
  await connection();
  if (!await getTeacher()) redirect("/");
  return <main className={styles.shell}><header className={styles.header}><Link className={styles.logo} href="/dashboard">checkmate<span>.</span></Link><Link className="back-navigation" href="/quizzes">Quizzes &amp; keys</Link></header><div className={styles.content}><p className={styles.eyebrow}>QUIZ / IMPORT</p><h1>Import a quiz</h1><p className={styles.description}>Upload a quiz PDF or photos, then review the questions. You can also upload a separate answer key.</p><ImportQuizForm /></div></main>;
}
