import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import styles from "./dashboard.module.css";

export const instant = false;

export default async function Dashboard() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled) redirect("/");
  const [quizzes, submissionCount] = await Promise.all([
    db.quiz.findMany({ where: { teacherId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, updatedAt: true, _count: { select: { sections: true } } } }),
    db.submission.count({ where: { teacherId: user.id } }),
  ]);
  return <main className={styles.shell}>
    <header className={styles.header}><span className={styles.logo}>checkmate<span>.</span></span><div className={styles.headerRight}><span className={styles.email}>{user.email}</span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className={styles.signout}>Sign out ↗</button></form></div></header>
    <div className={styles.body}><aside className={styles.sidebar}><p className={styles.navLabel}>WORKSPACE</p><nav aria-label="Workspace"><span className={styles.active} aria-current="page">▦ <span>Overview</span></span><Link className={styles.navLink} href="/students">♙ <span>Students</span></Link><Link className={styles.navLink} href="/submissions">▤ <span>Submissions</span></Link></nav><p className={styles.sidebarNote}>Your space to create, review, and keep track.</p></aside>
      <div className={styles.content}><section className={styles.welcome}><div><p className={styles.eyebrow}>YOUR WORKSPACE <span>✳</span></p><h1>Hello, {user.name.split(" ")[0]}.</h1><p>Here’s what’s happening in your classroom.</p></div><Link className={styles.primary} href="/quizzes/new"> <span>＋</span> New quiz</Link></section>
        <section className={styles.stats} aria-label="Workspace summary"><div><p>YOUR QUIZZES</p><strong>{String(quizzes.length).padStart(2, "0")}</strong><span>Quizzes created</span></div><div><p>SUBMISSIONS</p><strong>{String(submissionCount).padStart(2, "0")}</strong><span>Student papers</span></div><div className={styles.statNote}><p>YOUR WORKFLOW</p><span><Link className={styles.studentLink} href="/submissions">Upload a paper ↗</Link></span></div></section>
        <section className={styles.quizSection}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 / YOUR WORK</p><h2>Recent quizzes</h2></div><span className={styles.counter}>{quizzes.length} TOTAL</span></div>
          {quizzes.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}>＋</div><h3>Your first quiz starts here.</h3><p>Create a quiz to start building your question paper.</p><Link href="/quizzes/new" className={styles.secondary}>Create a quiz <span>↗</span></Link></div> : <div className={styles.list}>{quizzes.map((quiz, i) => <div className={styles.quizRow} key={quiz.id}><span className={styles.number}>{String(i + 1).padStart(2, "0")}</span><div><h3><Link href={`/quizzes/${quiz.id}`}>{quiz.title} ↗</Link></h3><p>{quiz._count.sections === 0 ? "Ready for questions" : `${quiz._count.sections} sections`}</p></div><time dateTime={quiz.updatedAt.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(quiz.updatedAt)}</time></div>)}</div>}
        </section><p className={styles.footer}>CHECKMATE / YOUR CLASSROOM COMPANION</p>
      </div></div>
  </main>;
}
