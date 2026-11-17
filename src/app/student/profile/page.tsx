import { connection } from "next/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { studentUser } from "../student-data";
import StudentShell from "../student-shell";
import styles from "../student-workspace.module.css";
import account from "@/app/account-profile.module.css";
import SchoolNameForm from "./school-name-form";

export const instant = false;
export default async function StudentProfile() {
  await connection();
  const user = await studentUser();
  const student = await db.student.findUnique({ where: { accountId: user.id }, select: { name: true } });
  const initial = (user.name.trim() || "Student").charAt(0).toUpperCase();

  return <StudentShell user={user} active="profile">
    <div className={`${styles.content} ${styles.profileContent}`}>
      <header className={styles.welcome}><h1>My profile.</h1><p>Your account and student details.</p></header>
      <div className={styles.profileGrid}>
        <section className={account.card} aria-labelledby="student-account-details">
          <h2 id="student-account-details" className={styles.profileTitle}>Account details</h2>
          <div className={account.identity}>
            <span className={account.avatar} aria-hidden="true">{initial}</span>
            <div><strong className={styles.profileName}>{user.name}</strong><p>Student account</p></div>
          </div>
          <dl className={account.details}>
            <div><dt>Account name</dt><dd>{user.name}</dd></div>
            <div><dt>Email address</dt><dd>{user.email}</dd></div>
          </dl>
        </section>
        <section className={`${account.card} ${styles.recordCard}`} aria-labelledby="student-record">
          <div className={styles.recordHeading}>
            <h2 id="student-record" className={styles.profileTitle}>Student record</h2>
            <span className={student ? account.activeBadge : styles.recordStatus}>{student ? "Linked" : "Not linked"}</span>
          </div>
          {student ? <>
            <dl className={account.details}><div><dt>School name</dt><dd>{student.name}</dd></div></dl>
            <details data-accordion className={styles.editSchoolName}>
              <summary>Edit school name</summary>
              <SchoolNameForm name={student.name} />
            </details>
          </> : <div className={styles.recordActions}>
            <div>
              <Link className={styles.joinProfile} href="/student/join">Join a class</Link>
              <p>Use a class code from your teacher.</p>
            </div>
            <div>
              <Link href="/student?connect=1#connect-record">Connect an existing record <span aria-hidden="true">→</span></Link>
              <p>Use a one-time student record invite.</p>
            </div>
          </div>}
          <div className={styles.recordHelp}>
            <h3>Need help?</h3>
            <p>Contact your teacher if your student record is incorrect.</p>
          </div>
        </section>
      </div>
    </div>
  </StudentShell>;
}
