import styles from "./mascot.module.css";

export default function HomeIdleMascot({ className }: { className?: string }) {
  return <span className={[className, styles.homeIdle].filter(Boolean).join(" ")} aria-hidden="true"><span className={styles.homeIdleFrame} /></span>;
}
