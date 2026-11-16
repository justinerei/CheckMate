import { connection } from "next/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { studentUser } from "../student-data";
import StudentShell from "../student-shell";
import styles from "../student-workspace.module.css";

export const instant = false;
export default async function StudentProfile() {
  await connection(); const user = await studentUser();
  const student = await db.student.findUnique({ where: { accountId: user.id }, select: { name: true } });
  return <StudentShell email={user.email} active="profile"><div className={styles.content}><header className={styles.welcome}><h1>My profile.</h1><p>Your account and connected student record.</p></header><section className={styles.section}><div className={styles.detailCard}><h2>Account details</h2><p>Name: <strong>{user.name}</strong></p><p>Email: <strong>{user.email}</strong></p><p>Connected student record: <strong>{student?.name ?? "Not connected"}</strong></p>{!student && <Link className={styles.link} href="/student">Connect with an invite →</Link>}</div><div className={styles.detailCard}><h2>Need help?</h2><p>If this is the wrong student record or you need help with your account, contact your teacher or administrator. Do not share your password.</p></div></section></div></StudentShell>;
}
