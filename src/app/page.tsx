import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Mascot from "@/app/mascot";
import styles from "./page.module.css";
import PasswordForm from "./password-form";
import { PendingSubmit } from "./pending-screen";
import Link from "next/link";
import { cookies } from "next/headers";

export const instant = false;

export default async function Home() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (user?.enabled) redirect(user.role === "STUDENT" ? "/student" : user.role === "ADMIN" ? "/admin" : "/dashboard");
  return <main className={styles.shell}>
    <div className={styles.top}><span className={styles.logo}>checkmate<span>.</span></span><span className={styles.label}>A little less checking. A little more teaching.</span></div>
    <div className={styles.layout}><section className={styles.intro}>
      <p className={styles.eyebrow}>YOUR CLASSROOM COMPANION <span>✳</span></p>
      <h1>Good work deserves<br /><span>a closer look.</span></h1>
      <p className={styles.description}>Create quizzes, review student papers, and keep every grade in your hands.</p>
      <div className={styles.steps}><span>01 &nbsp; CREATE</span><span>02 &nbsp; REVIEW</span><span>03 &nbsp; FINALIZE</span></div>
    </section><section className={styles.card} aria-labelledby="sign-in-title">
      <div className={styles.cardTop}><span>TEACHER ACCESS</span><span className={styles.dot}>●</span></div>
      <Mascot state="ready" className={styles.mascot} width={104} height={104} />
      <h2 id="sign-in-title">Welcome to CheckMate.</h2><p>Sign in to create quizzes and review submissions.</p>
      {session && !user?.enabled && <p className={styles.warning} role="alert">This account is unavailable. Contact your administrator.</p>}
      <PasswordForm />
      <div className={styles.divider}><span>or</span></div>
      <form action={async () => { "use server"; (await cookies()).delete("checkmate-student-signup"); await signIn("google", { redirectTo: "/dashboard" }); }}>
        <PendingSubmit className={styles.button} pendingLabel="Connecting to Google…"><span aria-hidden="true" className={styles.google}>G</span>Continue with Google <span aria-hidden="true">↗</span></PendingSubmit>
      </form><p className={styles.note}><Link href="/student/sign-in">Student? Sign in here.</Link></p>
    </section></div><footer className={styles.footer}><span>CHECKMATE / FOR TEACHERS</span><span>MADE FOR THE WORK THAT MATTERS.</span></footer>
  </main>;
}
