import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import styles from "../page.module.css";

export const instant = false;

export default async function Dashboard() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled) redirect("/");
  return <main className={styles.shell}>
    <div className={styles.top}><span className={styles.logo}>checkmate<span>.</span></span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className={styles.signout}>Sign out ↗</button></form></div>
    <div className={styles.dashboard}><p className={styles.eyebrow}>YOUR WORKSPACE <span>✳</span></p><h1>Hello, {user.name}.</h1><p className={styles.description}>You’re signed in. Your quiz workspace is coming next.</p></div>
    <footer className={styles.footer}><span>CHECKMATE / FOR TEACHERS</span></footer>
  </main>;
}
