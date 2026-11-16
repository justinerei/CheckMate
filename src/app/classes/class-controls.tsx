"use client";
import { useActionState, useState } from "react";
import { createClass, findClass, joinClass } from "./actions";
import Mascot from "@/app/mascot";
import Link from "next/link";
import styles from "./class-controls.module.css";

const initial = { message: "", ok: false };

export function CreateClass() {
  const [state, action, pending] = useActionState(createClass, initial);
  return <form action={action}><label>Class name <input name="name" placeholder="e.g. Biology - Section A" maxLength={120} required /></label><button disabled={pending}>{pending ? "Creating…" : "Create class"}</button>{state.message && <p role="status">{state.message}</p>}</form>;
}

export function JoinClass({ code = "" }: { code?: string }) {
  const [state, action, pending] = useActionState(joinClass, initial);
  const [value, setValue] = useState(code);
  const [preview, setPreview] = useState<{ name?: string; teacher?: string; schoolName?: string | null; accountName?: string; error?: string } | null>(null);
  const [looking, setLooking] = useState(false);
  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLooking(true); setPreview(null);
    try { setPreview(await findClass(value)); } catch { setPreview({ error: "Could not find the class. Please try again." }); } finally { setLooking(false); }
  }
  if (state.ok) return <div className={styles.success} role="status"><Mascot state="celebrate" width={80} height={80} /><div><strong>You joined the class!</strong><p>{state.message}</p><Link href="/student/classes">View my classes →</Link></div></div>;
  if (preview?.name) return <div className={styles.confirm}><Mascot state="focused" width={72} height={72} /><div><strong>Join {preview.name}?</strong><p>Teacher: {preview.teacher}</p><p>Your teacher can link your checked papers to your account.</p><form action={action}><input type="hidden" name="code" value={value} />{preview.schoolName ? <p>School name: <strong>{preview.schoolName}</strong> · <Link href="/student/profile">Change in My profile</Link></p> : <label>School name<input name="schoolName" defaultValue={preview.accountName ?? ""} autoComplete="name" maxLength={120} required /><small>Use the name you write on your school papers. Your teachers will see this name.</small></label>}<button type="submit" disabled={pending}>{pending ? "Joining…" : "Confirm and join"}</button><button type="button" className={styles.secondary} disabled={pending} onClick={() => setPreview(null)}>Cancel</button></form>{state.message && <p role="alert">{state.message}</p>}</div></div>;
  return <form onSubmit={check}><label>Class code <input name="code" value={value} onChange={event => setValue(event.target.value)} autoComplete="off" required /></label><button disabled={looking}>{looking ? "Finding class…" : "Continue"}</button>{preview?.error && <p role="alert">{preview.error}</p>}</form>;
}

export function StudentClasses({ classes }: { classes: { id: string; name: string; teacher: { name: string } }[] }) {
  if (!classes.length) return null;
  return <div><p>Joined classes</p><ul>{classes.map(classroom => <li key={classroom.id}>{classroom.name} · {classroom.teacher.name}</li>)}</ul></div>;
}

export function ShareClass({ code }: { code: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    const link = `${window.location.origin}/student/join?code=${encodeURIComponent(code)}`;
    try { await navigator.clipboard.writeText(link); setMessage("Invite link copied."); } catch { setMessage("Copy the code below and share it with your students."); }
  }
  return <div><button type="button" onClick={copy}>Copy invite link</button><details><summary>Show class code</summary><code>{code}</code></details>{message && <p role="status">{message}</p>}</div>;
}
