import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import styles from "./page.module.css";

export const instant = false;

export default async function Home() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (user?.enabled) redirect("/dashboard");
  return <main className={styles.shell}>
    <div className={styles.top}><span className={styles.logo}>checkmate<span>.</span></span><span className={styles.label}>A little less checking. A little more teaching.</span></div>
    <div className={styles.layout}><section className={styles.intro}>
      <p className={styles.eyebrow}>YOUR CLASSROOM COMPANION <span>✳</span></p>
      <h1>Good work deserves<br /><span>a closer look.</span></h1>
      <p className={styles.description}>Create quizzes, review student papers, and keep every grade in your hands.</p>
      <div className={styles.steps}><span>01 &nbsp; CREATE</span><span>02 &nbsp; REVIEW</span><span>03 &nbsp; FINALIZE</span></div>
    </section><section className={styles.card} aria-labelledby="sign-in-title">
      <div className={styles.cardTop}><span>TEACHER ACCESS</span><span className={styles.dot}>●</span></div>
      <div className={styles.symbol} aria-hidden="true">✓</div>
      <h2 id="sign-in-title">Welcome to CheckMate.</h2><p>Sign in to create quizzes and review submissions.</p>
      {session && !user?.enabled && <p className={styles.warning} role="alert">This account is unavailable. Contact your administrator.</p>}
      <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
        <button className={styles.button} type="submit"><span aria-hidden="true" className={styles.google}>G</span>Continue with Google <span aria-hidden="true">↗</span></button>
      </form><p className={styles.note}>Your students don’t need an account.</p>
    </section></div><footer className={styles.footer}><span>CHECKMATE / FOR TEACHERS</span><span>MADE FOR THE WORK THAT MATTERS.</span></footer>
  </main>;
}
