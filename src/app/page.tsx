import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Mascot from "@/app/mascot";
import styles from "./page.module.css";
import PasswordForm from "./password-form";
import { PendingSubmit } from "./pending-screen";
import { cookies } from "next/headers";
import RoleSelector from "./role-selector";

export const instant = false;

export default async function Home() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (user?.enabled) redirect(user.role === "STUDENT" ? "/student" : user.role === "ADMIN" ? "/admin" : "/dashboard");
  return <main className={styles.shell}>
    <div className={styles.top}><span className={styles.logo}>checkmate<span>.</span></span><span className={styles.label}>A little less checking. A little more teaching.</span></div>
    <div className={styles.layout}><section className={styles.intro}>

      <h1>Good work deserves<br /><span>a closer look.</span></h1>
      <p className={styles.description}>Create quizzes, review student papers, and keep every grade in your hands.</p>
      <div className={styles.steps}><span>01 &nbsp; CREATE</span><span>02 &nbsp; REVIEW</span><span>03 &nbsp; FINALIZE</span></div>
    </section><section className={styles.card} aria-labelledby="sign-in-title">
      <div className={styles.cardTop}><span>WELCOME TO CHECKMATE</span><span className={styles.dot}>●</span></div>
      <RoleSelector current="teacher" />
      <Mascot state="ready" className={styles.mascot} width={104} height={104} />
      <h2 id="sign-in-title">Teacher sign in.</h2><p>Create quizzes, check papers, and manage your students.</p>
      {session && !user?.enabled && <p className={styles.warning} role="alert">This account is unavailable. Contact your administrator.</p>}
      <PasswordForm />
      <div className={styles.divider}><span>or</span></div>
      <form action={async () => { "use server"; (await cookies()).delete("checkmate-student-signup"); await signIn("google", { redirectTo: "/" }); }}>
        <PendingSubmit className={styles.button} pendingLabel="Connecting to Google…"><span aria-hidden="true" className={styles.google}>G</span>Continue with Google <span aria-hidden="true">↗</span></PendingSubmit>
      </form><p className={styles.roleHint}>Already have an account? Your saved role determines your workspace.</p>
    </section></div><footer className={styles.footer}><span>CHECKMATE / YOUR CLASSROOM COMPANION</span><span>MADE FOR THE WORK THAT MATTERS.</span></footer>
  </main>;
}
