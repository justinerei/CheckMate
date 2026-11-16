import Link from "next/link";
import styles from "./page.module.css";

export default function RoleSelector({ current }: { current: "teacher" | "student" }) {
  return <nav className={styles.roleSelector} aria-label="Choose sign-in type">
    <Link href="/" className={current === "teacher" ? styles.roleSelected : ""} aria-current={current === "teacher" ? "page" : undefined}>Teacher</Link>
    <Link href="/student/sign-in" className={current === "student" ? styles.roleSelected : ""} aria-current={current === "student" ? "page" : undefined}>Student</Link>
  </nav>;
}
