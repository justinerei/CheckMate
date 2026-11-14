import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import KeyForm from "./key-form";
import DraftBackLink from "./draft-back-link";
import styles from "../../submissions/submissions.module.css";
export const instant = false;
export default async function ExistingQuiz({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await connection();
  const { from } = await searchParams;
  const fromChecking = from === "check";
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  return <main className={styles.shell}><header className={styles.header}><DraftBackLink teacherId={teacher.id} logo /><DraftBackLink teacherId={teacher.id} fromChecking={fromChecking} /></header><div className={styles.content}><p className={styles.eyebrow}>ANSWER KEY / SETUP</p><h1>Add an answer key</h1><p className={styles.description}>Add your answer key, review the detected answers, then use it to check a paper. You can also enter answers manually.</p><KeyForm teacherId={teacher.id} fromChecking={fromChecking} /></div></main>;
}
