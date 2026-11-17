"use client";

import { useState, useSyncExternalStore } from "react";
import styles from "@/app/account-profile.module.css";
import { mutedNotificationKinds } from "@/lib/admin-notification-preferences";

const options = [
  { kind: "account", title: "New account registrations", description: "When a teacher or student joins CheckMate." },
  { kind: "failed", title: "Failed checks", description: "When failed pages are ready to retry." },
  { kind: "quiz", title: "Daily quiz summary", description: "A daily count of newly created quizzes." },
] as const;

type Preference = (typeof options)[number]["kind"];
const changed = "checkmate-notification-preferences";

function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changed, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useNotificationPreferences(adminId: string) {
  const key = `checkmate:admin-notification-preferences:${adminId}`;
  const value = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }, () => null);
  const muted = mutedNotificationKinds(value);

  function setEnabled(kind: Preference, enabled: boolean) {
    const next = new Set(muted);
    if (enabled) next.delete(kind);
    else next.add(kind);
    try {
      localStorage.setItem(key, [...next].filter(Boolean).join(","));
    } catch {
      return false;
    }
    window.dispatchEvent(new Event(changed));
    return true;
  }

  return { muted, setEnabled };
}

export default function NotificationPreferences({ adminId }: { adminId: string }) {
  const { muted, setEnabled } = useNotificationPreferences(adminId);
  const [saved, setSaved] = useState<boolean | null>(null);

  return <section className={styles.preferences} aria-labelledby="notification-preferences">
    <h2 id="notification-preferences">Notification preferences</h2>
    <p>Choose which alerts appear in your Admin notification bell on this browser.</p>
    {options.map(option => <label className={styles.preferenceRow} key={option.kind}>
      <span>
        <strong id={`preference-${option.kind}`}>{option.title}</strong>
        <small id={`preference-${option.kind}-description`}>{option.description}</small>
      </span>
      <input type="checkbox" role="switch" aria-labelledby={`preference-${option.kind}`}
        aria-describedby={`preference-${option.kind}-description`} checked={!muted.has(option.kind)}
        onChange={event => setSaved(setEnabled(option.kind, event.target.checked))} />
    </label>)}
    <p className={styles.preferenceStatus} role="status">{saved === null ? "" : saved ? "Saved" : "Couldn’t save. Check your browser storage settings."}</p>
  </section>;
}
