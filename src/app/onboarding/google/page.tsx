import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { validPendingGoogle } from "@/lib/pending-google";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Mascot from "@/app/mascot";
import { PendingSubmit } from "@/app/pending-screen";
import styles from "@/app/page.module.css";
import RoleForm from "./role-form";

export const instant = false;
export default async function GoogleOnboarding() {
  await connection(); const session = await auth();
  const existing = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { id: true } }) : null;
  if (existing) redirect("/");
  const pending = (session as (typeof session & { pendingGoogle?: unknown }))?.pendingGoogle;
  if (!validPendingGoogle(pending) || session?.user?.id !== pending.googleId) return <main className={styles.shell}><section className={styles.card}><h1>Google sign-in expired.</h1><p>Please sign in again to continue setting up your account.</p><Link href="/">Back to sign in →</Link></section></main>;
  return <main className={styles.shell}><div className={styles.top}><Link className={styles.logo} href="/">checkmate<span>.</span></Link><span className={styles.label}>A little less checking. A little more teaching.</span></div><div className={styles.layout}><section className={styles.intro}><h1>Good work deserves<br /><span>a closer look.</span></h1><p className={styles.description}>One more step to set up your CheckMate account.</p></section><section className={styles.card}><div className={styles.cardTop}><span>WELCOME TO CHECKMATE</span><span className={styles.dot}>●</span></div><Mascot state="ready" className={styles.mascot} width={104} height={104} /><h2>How will you use CheckMate?</h2><p>Signed in with Google as {pending.email}. Choose the role for your new account.</p><RoleForm /><p className={styles.roleHint}>Students can connect to their teacher with an invite after setup.</p><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.changeAccount} pendingLabel="Signing out…">Use a different account</PendingSubmit></form></section></div></main>;
}
