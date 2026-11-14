import Link from "next/link";
import styles from "./loading-skeleton.module.css";

type Screen = "site" | "overview" | "quizzes" | "students";

const navigation = [
  { id: "overview", label: "Overview", href: "/dashboard", path: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" },
  { id: "quizzes", label: "Quizzes & keys", href: "/quizzes", path: "M6 3h9l3 3v15H6z M14 3v4h4 M9 11h6 M9 15h6" },
  { id: "students", label: "Students", href: "/students", path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0" },
];

function Line({ className = "" }: { className?: string }) {
  return <span className={`${styles.line} ${className}`} />;
}

function Navigation({ screen }: { screen: Screen }) {
  return <nav className={styles.nav} aria-label="Workspace">
    <p className={styles.navLabel}>WORKSPACE</p>
    {navigation.map(item => <Link key={item.id} href={item.href} className={`${styles.navItem} ${screen === item.id ? styles.navActive : ""}`} aria-current={screen === item.id ? "page" : undefined}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={item.path} /></svg><span>{item.label}</span>
    </Link>)}
    <div className={styles.divider} />
    <Link href="/quizzes/new" className={styles.navItem}><span className={styles.plus} aria-hidden="true">+</span><span>Create a quiz</span></Link>
  </nav>;
}

export default function LoadingSkeleton({ screen }: { screen: Screen }) {
  const workspace = screen !== "site";
  return <div className={workspace ? styles.workspace : styles.site}>
    <span className={styles.srOnly} role="status">Loading page…</span>
    {workspace ? <div className={styles.workspaceLayout}>
      <aside className={styles.rail}>
        <Link href="/dashboard" className={styles.brand}>checkmate<span>.</span></Link>
        <Navigation screen={screen} />
        <div className={styles.railFooter} aria-hidden="true"><span>Your classroom, in one place.</span><Line className={styles.accountLine} /></div>
      </aside>
      <header className={styles.mobileHeader}>
        <Link href="/dashboard" className={styles.brand}>checkmate<span>.</span></Link>
        <details className={styles.mobileMenu}><summary>Menu <span aria-hidden="true">☰</span></summary><div className={styles.menuPanel}><Navigation screen={screen} /></div></details>
      </header>
      <main className={styles.content} aria-busy="true">
        <div aria-hidden="true">
          <p className={styles.eyebrow}>YOUR WORKSPACE <span>✳</span></p>
          <Line className={styles.heading} /><Line className={styles.introLine} />
          {screen === "overview" ? <>
            <div className={styles.sectionHeading}><p className={styles.eyebrow}>01 / GET STARTED</p><h2>What would you like to do?</h2></div>
            <div className={styles.actions}>
              <div className={`${styles.card} ${styles.primaryCard}`}><div className={styles.cardTop}><Line className={styles.overline} /><Line className={styles.circle} /></div><div className={styles.primaryBody}><Line className={styles.cardTitleLarge} /><Line className={styles.cardDescription} /><Line className={styles.cardDescriptionShort} /><Line className={styles.buttonLine} /></div></div>
              <div className={styles.stacked}>{[0,1].map(item => <div className={styles.card} key={item}><Line className={styles.cardIcon} /><Line className={styles.cardTitle} /><Line className={styles.cardDescription} /></div>)}</div>
            </div>
            <div className={styles.metrics}>{["MY QUIZZES", "IN REVIEW", "FINALIZED"].map(item => <div key={item}><span>{item}</span><Line className={styles.metricValue} /><Line className={styles.metricCaption} /></div>)}</div>
            <div className={styles.recentHeading}><p className={styles.eyebrow}>02 / YOUR WORK</p><h2>Recent papers</h2><p>Continue reviewing or revisit a result.</p></div>
          </> : <>
            <div className={styles.sectionHeading}><Line className={styles.sectionLine} /></div>
            {screen === "students" && <div className={styles.studentActions}>{[0,1].map(item => <div className={styles.card} key={item}><Line className={styles.cardTitle} /><Line className={styles.cardDescription} /></div>)}</div>}
          </>}
          <div className={styles.list}>{[0,1,2].map(item => <div className={styles.row} key={item}><Line className={styles.rowIcon} /><div><Line className={styles.rowTitle} /><Line className={styles.rowDetail} /></div><Line className={styles.rowEnd} /></div>)}</div>
        </div>
      </main>
    </div> : <div className={styles.siteLayout}>
      <header><Link href="/" className={styles.siteBrand}>checkmate<span>.</span></Link></header>
      <main className={styles.siteContent} aria-busy="true" aria-hidden="true"><div><Line className={styles.siteEyebrow} /><Line className={styles.siteHeading} /><Line className={styles.siteHeadingShort} /><Line className={styles.siteDescription} /></div><div className={styles.signInCard}><Line className={styles.siteEyebrow} /><Line className={styles.cardIcon} /><Line className={styles.signInHeading} /><Line /><Line className={styles.fieldLine} /><Line className={styles.fieldLine} /></div></main>
    </div>}
  </div>;
}
