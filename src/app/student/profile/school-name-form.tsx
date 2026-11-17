"use client";
import { useActionState } from "react";
import { updateSchoolName } from "./actions";

export default function SchoolNameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateSchoolName, { message: "", ok: false });
  return <form action={action}><label>School name<input name="schoolName" defaultValue={name} autoComplete="name" maxLength={120} required /></label><p>This is the name your teachers see. Use the name on your school papers.</p><button type="submit" disabled={pending}>{pending ? "Saving…" : "Save school name"}</button>{state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}</form>;
}
