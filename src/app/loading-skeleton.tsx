import styles from "./loading-skeleton.module.css";

type Screen = "site" | "overview" | "quizzes" | "students";

function Line({ className = "" }: { className?: string }) {
  return <span className={`${styles.line} ${className}`} />;
}

const navigation = [
  { id: "overview", label: "Overview", path: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" },
  { id: "quizzes", label: "Quizzes & keys", path: "M6 3h9l3 3v15H6z M14 3v4h4 M9 11h6 M9 15h6" },
  { id: "students", label: "Students", path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0" },
];

export default function LoadingSkeleton({ screen }: { screen: Screen }) {
  const workspace = screen !== "site";
  return <div className={workspace ? styles.workspace : styles.site} role="status" aria-label="Loading page">
    <span className={styles.srOnly}>Loading page…</span>
    <div aria-hidden="true" className={workspace ? styles.workspaceLayout : styles.siteLayout}>
      {workspace ? <>
        <aside className={styles.rail}>
          <div className={styles.brand}>checkmate<span>.</span></div>
          <div className={styles.railLabel}>WORKSPACE</div>
          <div className={styles.nav}>{navigation.map(item => <div key={item.id} className={`${styles.navItem} ${screen === item.id ? styles.navActive : ""}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={item.path} /></svg><span>{item.label}</span></div>)}</div>
          <div className={styles.divider} /><div className={styles.navItem}><span className={styles.plus}>+</span><span>Create a quiz</span></div>
          <div className={styles.railFooter}><span>Your classroom, in one place.</span><Line /></div>
        </aside>
        <header className={styles.mobileHeader}><div className={styles.brand}>checkmate<span>.</span></div><div className={styles.menu}>Menu <span>☰</span></div></header>
        <main className={styles.content}>
          <p className={styles.staticEyebrow}>YOUR WORKSPACE <span>✳</span></p><Line className={styles.heading} />
          {screen === "overview" ? <p className={styles.staticDescription}>Ready when you are. Pick up where you left off or start something new.</p> : <Line className={styles.description} />}
          {screen === "overview" ? <>
            <div className={styles.sectionTitle}><p className={styles.staticEyebrow}>01 / GET STARTED</p><h2>What would you like to do?</h2></div>
            <div className={styles.actions}>
              <div className={`${styles.card} ${styles.primaryCard}`}><div className={styles.primaryTop}><span>START CHECKING</span><span className={styles.arrowCircle}>↗</span></div><div className={styles.primaryContent}><strong>Check a paper</strong><p>Choose an answer key, upload a student paper, and review the results.</p><span className={styles.primaryButton}>Start checking <span>→</span></span></div></div>
              <div className={styles.stacked}><div className={styles.card}><span className={styles.actionIcon}>▤</span><strong>My quizzes and keys</strong><p>View answer keys and quizzes you’ve already saved.</p></div><div className={styles.card}><span className={styles.actionIcon}>＋</span><strong>Create a quiz</strong><p>Build a printable quiz in CheckMate.</p></div></div>
            </div>
            <div className={styles.metrics}>{["MY QUIZZES", "IN REVIEW", "FINALIZED"].map(item => <div key={item}><span>{item}</span><Line /><Line /></div>)}</div>
          </> : <>
            <div className={styles.sectionTitle}><Line /></div>
            {screen === "students" && <div className={styles.studentActions}><div className={styles.card}><Line /><Line /></div><div className={styles.card}><Line /><Line /></div></div>}
          </>}
          {screen === "overview" && <div className={styles.recentHeading}><p className={styles.staticEyebrow}>02 / YOUR WORK</p><h2>Recent papers</h2><p>Continue reviewing or revisit a result.</p></div>}
          <div className={styles.list}>{[0,1,2].map(item => <div className={styles.row} key={item}><Line className={styles.icon} /><div><Line /><Line /></div><Line className={styles.rowEnd} /></div>)}</div>
        </main>
      </> : <>
        <header className={styles.siteHeader}><div className={styles.brand}>checkmate<span>.</span></div></header>
        <main className={styles.siteContent}><div><Line className={styles.eyebrow} /><Line className={styles.siteHeading} /><Line className={styles.siteHeadingShort} /><Line className={styles.description} /></div><div className={styles.signInCard}><Line className={styles.eyebrow} /><Line className={styles.icon} /><Line className={styles.cardHeading} /><Line /><Line /><Line /></div></main>
      </>}
    </div>
  </div>;
}
