import styles from "./loading-skeleton.module.css";

type Screen = "site" | "overview" | "quizzes" | "students";

function Line({ className = "" }: { className?: string }) {
  return <span className={`${styles.line} ${className}`} />;
}

export default function LoadingSkeleton({ screen }: { screen: Screen }) {
  const workspace = screen !== "site";
  return <div className={workspace ? styles.workspace : styles.site} role="status" aria-label="Loading page">
    <span className={styles.srOnly}>Loading page…</span>
    <div aria-hidden="true" className={workspace ? styles.workspaceLayout : styles.siteLayout}>
      {workspace ? <>
        <aside className={styles.rail}>
          <div className={styles.brand}>checkmate<span>.</span></div>
          <Line className={styles.railLabel} />
          <div className={styles.nav}><Line /><Line /><Line /></div>
          <div className={styles.divider} /><Line className={styles.navAction} />
          <div className={styles.railFooter}><Line /><Line /></div>
        </aside>
        <header className={styles.mobileHeader}><div className={styles.brand}>checkmate<span>.</span></div><Line className={styles.menu} /></header>
        <main className={styles.content}>
          <Line className={styles.eyebrow} /><Line className={styles.heading} /><Line className={styles.description} />
          {screen === "overview" ? <>
            <div className={styles.sectionTitle}><Line /></div>
            <div className={styles.actions}><div className={`${styles.card} ${styles.primaryCard}`}><Line /><Line /><Line /></div><div className={styles.stacked}><div className={styles.card}><Line /><Line /></div><div className={styles.card}><Line /><Line /></div></div></div>
            <div className={styles.metrics}>{[0,1,2].map(item => <div key={item}><Line /><Line /></div>)}</div>
          </> : <>
            <div className={styles.sectionTitle}><Line /></div>
            {screen === "students" && <div className={styles.studentActions}><div className={styles.card}><Line /><Line /></div><div className={styles.card}><Line /><Line /></div></div>}
          </>}
          <div className={styles.list}>{[0,1,2].map(item => <div className={styles.row} key={item}><Line className={styles.icon} /><div><Line /><Line /></div><Line className={styles.rowEnd} /></div>)}</div>
        </main>
      </> : <>
        <header className={styles.siteHeader}><div className={styles.brand}>checkmate<span>.</span></div></header>
        <main className={styles.siteContent}><div><Line className={styles.eyebrow} /><Line className={styles.siteHeading} /><Line className={styles.siteHeadingShort} /><Line className={styles.description} /></div><div className={styles.signInCard}><Line className={styles.eyebrow} /><Line className={styles.icon} /><Line className={styles.cardHeading} /><Line /><Line /><Line /></div></main>
      </>}
    </div>
  </div>;
}
