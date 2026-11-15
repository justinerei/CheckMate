import Link from "next/link";
import styles from "./loading-skeleton.module.css";
import { WorkspaceShell, type Active } from "./workspace-frame";

type Variant = "home" | "dashboard" | "library" | "students" | "overview" | "form" | "editor" | "review" | "print";

function Line({ size = "medium" }: { size?: "short" | "medium" | "long" | "title" | "button" }) {
  return <span className={`${styles.line} ${styles[size]}`} />;
}

function Blocks({ count = 3 }: { count?: number }) {
  return <div className={styles.blocks}>{Array.from({ length: count }, (_, index) => <div className={styles.block} key={index}><Line size="short" /><Line size="long" /><Line size="medium" /></div>)}</div>;
}

export default function LoadingSkeleton({ variant = "form" }: { variant?: Variant }) {
  const workspace = ["dashboard", "library", "students", "overview"].includes(variant);
  const home = variant === "home";
  const print = variant === "print";
  const active: Active = variant === "dashboard" ? "overview" : variant === "students" ? "students" : "quizzes";
  if (workspace) return <WorkspaceShell active={active}><span className={styles.status} role="status">Loading page…</span><div className={styles.workspaceContent} aria-busy="true" aria-hidden="true"><Line size="short" /><Line size="title" /><Line size="long" />{variant === "dashboard" ? <><div className={styles.dashboardCards}><div className={styles.panel}><Line size="short" /><Line size="title" /><Line size="long" /><Line size="button" /></div><Blocks count={2} /></div><Blocks /></> : <><div className={styles.toolbar}><Line size="medium" /><Line size="button" /></div><Blocks count={variant === "students" ? 2 : 3} /><div className={styles.list}><Blocks /></div></>}</div></WorkspaceShell>;
  return <div className={`${styles.shell} ${workspace ? styles.workspace : ""}`}>
    <span className={styles.status} role="status">Loading page…</span>
    <div className={styles.body} aria-busy="true">
      <header className={styles.header}><Link href={home ? "/" : "/dashboard"} className={styles.brand}>checkmate<span>.</span></Link>{!home && <Line size="button" />}</header>
      <main className={`${styles.content} ${print ? styles.print : ""}`} aria-hidden="true">
        {home ? <div className={styles.homeLayout}><div><Line size="short" /><Line size="title" /><Line size="title" /><Line size="long" /></div><div className={styles.panel}><Line size="short" /><Line size="title" /><Line size="long" /><Line size="button" /><Line size="button" /></div></div> : <>
          <Line size="short" /><Line size="title" /><Line size="long" />
          {variant === "dashboard" && <><div className={styles.dashboardCards}><div className={styles.panel}><Line size="short" /><Line size="title" /><Line size="long" /><Line size="button" /></div><Blocks count={2} /></div><Blocks /></>}
          {(variant === "library" || variant === "students" || variant === "overview") && <><div className={styles.toolbar}><Line size="medium" /><Line size="button" /></div><Blocks count={variant === "students" ? 2 : 3} /><div className={styles.list}><Blocks /></div></>}
          {(variant === "form" || variant === "editor") && <><div className={styles.panel}><Line size="medium" /><Line size="long" /><Line size="button" /></div><Blocks count={variant === "editor" ? 3 : 2} /></>}
          {variant === "review" && <div className={styles.reviewLayout}><div className={styles.paper}><Line size="long" /><Line size="medium" /><Line size="long" /></div><Blocks count={3} /></div>}
          {print && <div className={styles.paper}><Line size="title" /><Line size="long" /><Blocks count={3} /></div>}
        </>}
      </main>
    </div>
  </div>;
}
