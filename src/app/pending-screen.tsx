"use client";

import { useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import Mascot from "@/app/mascot";
import styles from "./pending-screen.module.css";

export function PendingScreen({ pending, message = "Working…" }: { pending: boolean; message?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setVisible(true), 350);
    return () => { window.clearTimeout(timer); setVisible(false); };
  }, [pending]);
  if (!pending || !visible) return null;
  return createPortal(<div className={styles.overlay} role="status" aria-live="polite"><div className={styles.card}><Mascot state="focused" width={96} height={96} /><span className={styles.spinner} aria-hidden="true" /><strong>{message}</strong><span>Please wait a moment.</span></div></div>, document.body);
}

export function PendingSubmit({ className, children, pendingLabel = "Saving…" }: { className?: string; children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <><PendingScreen pending={pending} message={pendingLabel} /><button type="submit" className={className} disabled={pending} aria-busy={pending}>{pending ? pendingLabel : children}</button></>;
}
