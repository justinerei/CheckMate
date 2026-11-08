"use client";
import { useEffect, useState } from "react";
import styles from "./quiz-editor.module.css";

export default function SaveNotice({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    url.searchParams.delete("notice");
    window.history.replaceState(window.history.state, "", url);
    const timer = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div className={styles.toast} role="status"><span>✓ {message}</span><button aria-label="Dismiss notification" onClick={() => setVisible(false)}>×</button></div>;
}
