import Link from "next/link";
import { connection } from "next/server";
import ResultList from "../result-list";
import StudentShell from "../student-shell";
import { studentResults, studentUser } from "../student-data";
import styles from "../student-workspace.module.css";

export const instant = false;
export default async function ResultsPage() {
  await connection();
  const user = await studentUser(); const student = await studentResults(user.id);
  return <StudentShell user={user} active="results"><div className={`${styles.content} ${styles.home}`} data-student-home><header className={styles.welcome}><h1>My results.</h1><p>Your quiz scores released by your teachers.</p></header>{student ? <section className={styles.section}><ResultList results={student.results} searchable /></section> : <div className={styles.empty}><div><strong>Connect your student record first</strong><p>Use the invite code from your teacher to see your results.</p><Link className={styles.link} href="/student?connect=1#connect-record">Connect account →</Link></div></div>}</div></StudentShell>;
}
