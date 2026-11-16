"use client";
import { useActionState, useState } from "react";
import { createClass, joinClass } from "./actions";

const initial = { message: "", ok: false };

export function CreateClass() {
  const [state, action, pending] = useActionState(createClass, initial);
  return <form action={action}><label>Class name <input name="name" placeholder="e.g. Biology - Section A" maxLength={120} required /></label><button disabled={pending}>{pending ? "Creating…" : "Create class"}</button>{state.message && <p role="status">{state.message}</p>}</form>;
}

export function JoinClass({ code = "" }: { code?: string }) {
  const [state, action, pending] = useActionState(joinClass, initial);
  return <form action={action}><label>Class code <input name="code" defaultValue={code} autoComplete="off" required /></label><button disabled={pending}>{pending ? "Joining…" : "Join class"}</button>{state.message && <p role="status">{state.message}</p>}</form>;
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
