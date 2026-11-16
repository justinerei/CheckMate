"use client";
import { useState } from "react";
import UnlockControl from "./unlock-control";
import AccountControl from "./account-control";
import styles from "./admin.module.css";
import { filterAdminAccounts } from "@/lib/admin-account-filter";

type Account = { id: string; name: string; email: string; role: string; enabled: boolean; createdAt: string; lockedUntil: string | null; _count: { quizzes: number; submissions: number } };
export default function AccountList({ users }: { users: Account[] }) {
  const [query, setQuery] = useState(""); const [role, setRole] = useState("ALL"); const [status, setStatus] = useState("ALL");
  const visible = filterAdminAccounts(users, query, role, status);
  return <><div className={styles.filters}><label>Search accounts<input type="search" placeholder="Search name or email" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} /></label><label>Role<select value={role} onChange={event => setRole(event.target.value)}><option value="ALL">All roles</option><option value="TEACHER">Teachers</option><option value="STUDENT">Students</option></select></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></select></label></div><p className={styles.count} role="status">{visible.length} of {users.length} accounts shown</p>{visible.length ? <ul className={styles.accounts}>{visible.map(user => <li key={user.id}><div className={styles.accountIcon} aria-hidden="true">♙</div><div className={styles.accountInfo}><strong>{user.name}</strong><span>{user.email}</span><small>Joined {user.createdAt} ? {user._count.quizzes} quizzes ? {user._count.submissions} submissions</small>{user.lockedUntil && <small>Locked until {user.lockedUntil}</small>}</div><div className={styles.tags}><span>{user.role === "TEACHER" ? "Teacher" : "Student"}</span><span className={user.enabled ? styles.active : styles.disabled}>{user.enabled ? "Active" : "Disabled"}</span></div>{user.lockedUntil && <UnlockControl id={user.id} name={user.name} />}<AccountControl id={user.id} name={user.name} enabled={user.enabled} /></li>)}</ul> : <div className={styles.empty}><strong>{users.length ? "No matching accounts" : "No accounts yet"}</strong><p>{users.length ? "Try changing your search or filters." : "Teacher and student accounts will appear here."}</p></div>}</>;
}
