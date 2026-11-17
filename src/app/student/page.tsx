import Link from "next/link";
import { connection } from "next/server";
import Mascot from "@/app/mascot";
import { ClaimInvite } from "./invite-controls";
import ResultList from "./result-list";
import StudentShell from "./student-shell";
import { studentResults, studentUser } from "./student-data";
import styles from "./student-workspace.module.css";
import { JoinClass } from "@/app/classes/class-controls";
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
  const count = student?.classes.length ?? 0;
  return <StudentShell user={user} active="overview"><div className={`${styles.content} ${styles.home}`} data-student-home>
    <header className={styles.welcome}><h1>Hello, {user.name.trim().split(/\s+/)[0] || "student"}.</h1><p>{student ? "Your released scores and classes, all in one place." : "Join your teacher's class to see your released scores."}</p></header>
    {student ? <div className={styles.homeGrid}>
      <section className={styles.homeResults} aria-labelledby="recent-results-heading">
        <div className={styles.sectionHeading}><div><h2 id="recent-results-heading">Recent results</h2><p>{student.results.length} released {student.results.length === 1 ? "result" : "results"}</p></div><Link href="/student/results">View all results <span aria-hidden="true">↗</span></Link></div>
        <ResultList results={student.results.slice(0, 5)} />
      </section>
      <section className={styles.homeClasses} aria-labelledby="home-classes-heading">
        <div className={styles.homeClassHeader}><span className={styles.homeMascot}><Mascot state="ready" width={72} height={72} /></span><div><h2 id="home-classes-heading">Your classes</h2><p>{count ? `${count} ${count === 1 ? "class" : "classes"} joined` : "Join a class to connect with your teacher."}</p></div></div>
        {count > 0 && <Link className={styles.homeClassesLink} href="/student/classes">My classes <span aria-hidden="true">→</span></Link>}
        <details data-accordion className={styles.homeJoin}><summary>Join a class</summary><p>Enter the class code from your teacher.</p><JoinClass /></details>
      </section>
    </div> : <>
      <section className={styles.connect}><Mascot state="ready" width={104} height={104} /><div><p className={styles.eyebrow}>YOUR CLASSES</p><h2>Join a class</h2><p>Open the invite link from your teacher or enter the class code here.</p><JoinClass /></div></section>
      <details data-accordion id="connect-record" className={styles.section} open={connect === "1"}><summary>Have a one-time student invite?</summary><p>Use this if your teacher already created a student record for you.</p><ClaimInvite /></details>
    </>}
  </div></StudentShell>;
}
