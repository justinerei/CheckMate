import Link from "next/link";
import { connection } from "next/server";
import Mascot from "@/app/mascot";
import { ClaimInvite } from "./invite-controls";
import ResultList from "./result-list";
import StudentShell from "./student-shell";
import { studentResults, studentUser } from "./student-data";
import styles from "./student-workspace.module.css";

export const instant = false;
export default async function StudentHome() {
  await connection();
  const user = await studentUser();
  const student = await studentResults(user.id);
  return <StudentShell email={user.email} active="overview"><div className={styles.content}><header className={styles.welcome}><h1>Hello, {user.name.trim().split(/\s+/)[0] || "student"}.</h1><p>{student ? `Your released quiz scores for ${student.name}, all in one place.` : "Connect with your teacher to see your released scores."}</p></header>{student ? <><section className={styles.metrics} aria-label="Results summary"><div><span>RELEASED RESULTS</span><strong>{String(student.results.length).padStart(2, "0")}</strong><small>Scores available to you</small></div><div><span>CONNECTED AS</span><strong className={styles.studentName}>{student.name}</strong><small>Your student record</small></div></section><section className={styles.section}><div className={styles.sectionHeading}><div><h2>Recent results</h2><p>Scores your teachers have released.</p></div><Link href="/student/results">View all <span aria-hidden="true">↗</span></Link></div><ResultList results={student.results.slice(0, 5)} /></section></> : <section className={styles.connect}><Mascot state="ready" width={104} height={104} /><div><p className={styles.eyebrow}>GET STARTED</p><h2>Connect your student record</h2><p>Enter the one-time invite code from your teacher. Once connected, released scores will appear here.</p><ClaimInvite /></div></section>}</div></StudentShell>;
}
