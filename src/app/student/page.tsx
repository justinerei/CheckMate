import Link from "next/link";
import { connection } from "next/server";
import Mascot from "@/app/mascot";
import { ClaimInvite } from "./invite-controls";
import ResultList from "./result-list";
import StudentShell from "./student-shell";
import { studentResults, studentUser } from "./student-data";
import styles from "./student-workspace.module.css";
import { JoinClass, StudentClasses } from "@/app/classes/class-controls";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const instant = false;
export default async function StudentHome({ searchParams }: { searchParams: Promise<{ connect?: string }> }) {
  await connection();
  const user = await studentUser();
  const { connect } = await searchParams;
  const pendingInvite = (await cookies()).get("class-invite")?.value;
  if (connect !== "1" && pendingInvite && /^[a-f0-9]{32}$/.test(pendingInvite)) redirect(`/student/join?code=${pendingInvite}`);
  const student = await studentResults(user.id);
  return <StudentShell user={user} active="overview"><div className={styles.content}><header className={styles.welcome}><h1>Hello, {user.name.trim().split(/\s+/)[0] || "student"}.</h1><p>{student ? `Your released quiz scores for ${student.name}, all in one place.` : "Join your teacher's class to see your released scores."}</p></header><section className={styles.connect}><Mascot state="ready" width={104} height={104} /><div><p className={styles.eyebrow}>YOUR CLASSES</p><h2>Join a class</h2><p>Open the invite link from your teacher or enter the class code here.</p><JoinClass />{student && <StudentClasses classes={student.classes} />}</div></section>{student ? <><section className={styles.metrics} aria-label="Results summary"><div><span>RELEASED RESULTS</span><strong>{String(student.results.length).padStart(2, "0")}</strong><small>Scores available to you</small></div><div><span>CONNECTED AS</span><strong className={styles.studentName}>{student.name}</strong><small>Your student record</small></div></section><section className={styles.section}><div className={styles.sectionHeading}><div><h2>Recent results</h2><p>Scores your teachers have released.</p></div><Link href="/student/results">View all results <span aria-hidden="true">↗</span></Link></div><ResultList results={student.results.slice(0, 5)} /></section></> : <details data-accordion id="connect-record" className={styles.section} open={connect === "1"}><summary>Have a one-time student invite?</summary><p>Use this if your teacher already created a student record for you.</p><ClaimInvite /></details>}</div></StudentShell>;
}
