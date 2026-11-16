import { connection } from "next/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { studentUser } from "../student-data";
import StudentShell from "../student-shell";
import styles from "../student-workspace.module.css";
import SchoolNameForm from "./school-name-form";

export const instant = false;
export default async function StudentProfile() {
  await connection(); const user = await studentUser();
  const student = await db.student.findUnique({ where: { accountId: user.id }, select: { name: true } });
  return <StudentShell email={user.email} active="profile"><div className={styles.content}><header className={styles.welcome}><h1>My profile.</h1><p>Your account and student details.</p></header><section className={styles.section}><div className={styles.detailCard}><h2>School name</h2>{student ? <SchoolNameForm name={student.name} /> : <><p>Choose your school name when you join a class, or connect an existing student record using your teacher&apos;s invite.</p><Link className={styles.link} href="/student">Join a class or connect a record →</Link></>}</div><div className={styles.detailCard}><h2>Account details</h2><p>Account name: <strong>{user.name}</strong></p><p>Email: <strong>{user.email}</strong></p></div><div className={styles.detailCard}><h2>Need help?</h2><p>If this is the wrong student record or you need help with your account, contact your teacher or administrator. Do not share your password.</p></div></section></div></StudentShell>;
}
