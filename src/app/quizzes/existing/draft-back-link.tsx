"use client";
import Link from "next/link";
import styles from "../../submissions/submissions.module.css";

export default function DraftBackLink({ teacherId, logo = false }: { teacherId: string; logo?: boolean }) {
  return <Link href="/dashboard" className={logo ? styles.logo : styles.back} onClick={event => { try { if (localStorage.getItem(`checkmate-existing-key-draft-${teacherId}`) && !window.confirm("You have an unsaved answer key. Leave? Your draft will stay in this browser.")) event.preventDefault(); } catch {} }}>{logo ? <>checkmate<span>.</span></> : "← Dashboard"}</Link>;
}
