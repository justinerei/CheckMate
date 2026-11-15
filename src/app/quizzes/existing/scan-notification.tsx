"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Mascot from "@/app/mascot";
import styles from "../../submissions/submissions.module.css";

const subscribe = () => () => {};
export default function ScanNotification({ message, error, onDismiss }: { message: string; error: boolean; onDismiss: () => void }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return null;
  return createPortal(<div className={`${styles.scanToast} ${error ? styles.scanToastError : styles.scanToastSuccess}`} role={error ? "alert" : "status"}>
    <Mascot state={error ? "concerned" : "celebrate"} width={48} height={48} className={styles.feedbackMascot} />
    <div className={styles.scanToastText}><strong>{error ? "Couldn’t check this file" : "Ready to review"}</strong><p>{message}</p></div>
    <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
  </div>, document.body);
}
