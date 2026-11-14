"use client";
import { useFormStatus } from "react-dom";
import styles from "./quiz-editor.module.css";
export default function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return <button className={styles.primary} type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : children}</button>;
}
