import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import KeyForm from "./key-form";
import DraftBackLink from "./draft-back-link";
import styles from "../../submissions/submissions.module.css";
export const instant = false;
export default async function ExistingQuiz() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  return <main className={styles.shell}><header className={styles.header}><DraftBackLink teacherId={teacher.id} logo /><DraftBackLink teacherId={teacher.id} /></header><div className={styles.content}><p className={styles.eyebrow}>EXISTING QUIZ / ANSWER KEY</p><h1>Check an existing quiz</h1><p className={styles.description}>Upload your answer key, then review every detected answer and section style before saving. You can also enter answers yourself. Uploaded key pages are sent to Groq for reading.</p><KeyForm teacherId={teacher.id} /></div></main>;
}
