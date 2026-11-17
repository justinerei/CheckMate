import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import styles from "./profile.module.css";

export const instant = false;

export default async function TeacherProfile() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const user = await db.user.findUnique({ where: { id: teacher.id }, select: { name: true, email: true } });
  if (!user) redirect("/");
  const initial = user.name.trim().charAt(0).toUpperCase() || "T";
  return <div className={styles.profile}>
    <header className={styles.header}><h1>My profile.</h1><p>Your account details, all in one place.</p></header>
    <section className={styles.card} aria-labelledby="account-heading">
      <div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{initial}</span><div><h2 id="account-heading">{user.name}</h2><p>Teacher account</p></div></div>
      <dl className={styles.details}><div><dt>Account name</dt><dd>{user.name}</dd></div><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Account type</dt><dd>Teacher</dd></div></dl>
    </section>
  </div>;
}
