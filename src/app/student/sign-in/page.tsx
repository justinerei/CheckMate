import Link from "next/link";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import PasswordForm from "@/app/password-form";
import styles from "@/app/page.module.css";
import { PendingSubmit } from "@/app/pending-screen";

export default function StudentSignIn() {
  return <main className={styles.shell}><div className={styles.top}><Link className={styles.logo} href="/">checkmate<span>.</span></Link><span className={styles.label}>STUDENT ACCESS</span></div><div className={styles.layout}><section className={styles.intro}><p className={styles.eyebrow}>YOUR RESULTS</p><h1>Your work.<br /><span>Your progress.</span></h1><p className={styles.description}>Sign in, connect the invite from your teacher, and view your released scores.</p></section><section className={styles.card}><h2>Student sign in</h2><p>Use your student account to continue.</p><PasswordForm student /><div className={styles.divider}><span>or</span></div><form action={async () => { "use server"; (await cookies()).set("checkmate-student-signup", "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 }); await signIn("google", { redirectTo: "/student" }); }}><PendingSubmit className={styles.button} pendingLabel="Connecting to Google…"><span className={styles.google} aria-hidden="true">G</span>Continue with Google <span aria-hidden="true">↗</span></PendingSubmit></form><p className={styles.note}><Link href="/">Teacher sign in</Link></p></section></div></main>;
}
