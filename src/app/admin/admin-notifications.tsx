"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useAdminLiveData } from "./admin-live-data";
import { useNotificationPreferences } from "./notification-preferences";
import styles from "./admin-live.module.css";

const localUpdate = "checkmate-notifications-read";
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
const paths = {
  locked: "M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4",
  failed: "M20 5v5h-5 M4 19v-5h5 M5 9a8 8 0 0 1 14-3l1 4 M4 14l1 4a8 8 0 0 0 14-3",
  account: "M11 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a7 7 0 0 1 12-5 M19 10v6 M16 13h6",
  quiz: "M5 20v-5 M12 20V9 M19 20V4",
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(localUpdate, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(localUpdate, callback);
  };
}

// Keep an in-memory copy for browsers that disable local storage.
const readInMemory = new Map<string, string>();

function snapshot(key: string) {
  const fallback = readInMemory.get(key);
  if (fallback) return fallback;
  try { return localStorage.getItem(key) ?? "[]"; }
  catch { return "[]"; }
}

function readIds(raw: string): string[] {
  try {
    const ids: unknown = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}

export default function AdminNotifications({ adminId }: { adminId: string }) {
  const { data, unavailable } = useAdminLiveData();
  const { muted } = useNotificationPreferences(adminId);
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const key = `checkmate:admin-notifications:${adminId}`;
  const stored = useSyncExternalStore(subscribe, () => snapshot(key), () => "[]");
  const read = new Set(readIds(stored));
  const notifications = data?.notifications.filter(item => !muted.has(item.kind)) ?? [];
  const isUnread = (item: (typeof notifications)[number]) => item.kind !== "quiz" && !read.has(item.id);
  const unread = notifications.filter(isUnread);

  function markRead(ids: string[]) {
    const next = JSON.stringify([...new Set([...readIds(snapshot(key)), ...ids])].slice(-100));
    try {
      localStorage.setItem(key, next);
      readInMemory.delete(key);
    } catch {
      readInMemory.set(key, next);
    }
    window.dispatchEvent(new Event(localUpdate));
  }

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menu.current?.open && event.target instanceof Node && !menu.current.contains(event.target)) {
        menu.current.open = false;
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return <details ref={menu} className={styles.notifications} onKeyDown={event => {
    if (event.key === "Escape" && menu.current?.open) {
      event.preventDefault();
      menu.current.open = false;
      trigger.current?.focus();
    }
  }}>
    <summary ref={trigger} className={styles.bell} aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications"}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {unread.length > 0 && <span className={styles.badge} aria-hidden="true">{unread.length}</span>}
    </summary>
    <section className={styles.popover} aria-label="Notifications">
      <header className={styles.popoverHeader}>
        <h2>Notifications</h2>
        {unread.length > 0 && <button type="button" onClick={() => {
          markRead(unread.map(item => item.id));
          trigger.current?.focus();
        }}>Mark all as read</button>}
      </header>
      {unavailable && <p className={styles.notice}>Live updates unavailable.</p>}
      {notifications.length ? <ul className={styles.notificationList}>
        {notifications.map(item => <li key={item.id}>
          <Link href={item.href} className={styles.notification} onClick={() => {
            if (isUnread(item)) markRead([item.id]);
            if (menu.current) menu.current.open = false;
          }}>
            <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[item.kind]} /></svg>
            <span><strong>{item.title}</strong><small>{item.detail}</small>{item.date && <time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time>}</span>
            {isUnread(item) && <span className={styles.unread} aria-label="Unread" />}
          </Link>
        </li>)}
      </ul> : !unavailable && <p className={styles.notice}>{data ? "No recent notifications." : "Loading notifications…"}</p>}
    </section>
  </details>;
}
