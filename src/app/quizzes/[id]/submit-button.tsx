"use client";
import { PendingSubmit } from "@/app/pending-screen";
import styles from "./quiz-editor.module.css";
export default function SubmitButton({ children }: { children: string }) {
  return <PendingSubmit className={styles.primary}>{children}</PendingSubmit>;
}
