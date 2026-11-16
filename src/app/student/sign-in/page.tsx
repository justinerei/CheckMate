import Link from "next/link";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import PasswordForm from "@/app/password-form";
import RoleSelector from "@/app/role-selector";
import Mascot from "@/app/mascot";
import styles from "@/app/page.module.css";
import { PendingSubmit } from "@/app/pending-screen";

export default function StudentSignIn() {
  return <main className={styles.shell}><div className={styles.top}><Link className={styles.logo} href="/">checkmate<span>.</span></Link><span className={styles.label}>A little less checking. A little more teaching.</span></div><div className={styles.layout}><section className={styles.intro}><h1>Your work.<br /><span>Your progress.</span></h1><p className={styles.description}>Connect with your teacher and view your released quiz scores.</p></section><section className={styles.card} aria-labelledby="student-sign-in-title"><div className={styles.cardTop}><span>WELCOME TO CHECKMATE</span><span className={styles.dot}>●</span></div><RoleSelector current="student" /><Mascot state="ready" className={styles.mascot} width={104} height={104} /><h2 id="student-sign-in-title">Student sign in.</h2><p>After signing in, use your teacher’s invite code to view your released scores.</p><PasswordForm student /><div className={styles.divider}><span>or</span></div><form action={async () => { "use server"; (await cookies()).set("checkmate-student-signup", "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 }); await signIn("google", { redirectTo: "/" }); }}><PendingSubmit className={styles.button} pendingLabel="Connecting to Google…"><span className={styles.google} aria-hidden="true">G</span>Continue with Google <span aria-hidden="true">↗</span></PendingSubmit></form><p className={styles.roleHint}>Already have an account? Your saved role determines your workspace.</p></section></div><footer className={styles.footer}><span>CHECKMATE / YOUR CLASSROOM COMPANION</span><span>MADE FOR THE WORK THAT MATTERS.</span></footer></main>;
}
