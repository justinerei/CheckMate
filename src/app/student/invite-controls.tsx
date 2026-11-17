"use client";
import { useActionState, useState } from "react";
import { claimStudentInvite, createStudentInvite, setResultReleased, setCorrectAnswersVisible } from "./actions";
import styles from "./student.module.css";
import { useRouter } from "next/navigation";

export function StudentInvite({ id }: { id: string }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() { setBusy(true); setCode(""); setMessage(""); try { const result = await createStudentInvite(id); setCode(result.code ?? ""); setMessage(result.error ?? ""); } catch { setMessage("Could not create an invite. Try again."); } finally { setBusy(false); } }
  return <details data-accordion className={styles.invite}><summary>Invite student to view scores</summary><p>Generate a one-time code. Give it privately to the student; it expires in 24 hours. A new code replaces previous unused codes.</p><button type="button" disabled={busy} onClick={create}>{busy ? "Creating…" : "Generate invite code"}</button>{code && <div><p>Student sign-in: {typeof window !== "undefined" ? `${window.location.origin}/student/sign-in` : "/student/sign-in"}</p><code className={styles.code}>{code}</code><button type="button" onClick={() => void navigator.clipboard.writeText(code).then(() => setMessage("Code copied."), () => setMessage("Select and copy the code above."))}>Copy code</button></div>}{message && <p role="status">{message}</p>}</details>;
}

export function ClaimInvite() {
  const [state, action, pending] = useActionState(claimStudentInvite, { message: "", ok: false });
  return <form action={action} className={styles.claim}><label>Invite code from your teacher<input name="code" required autoComplete="off" maxLength={43} /></label><button disabled={pending}>{pending ? "Connecting…" : "Connect account"}</button>{state.message && <p role="status">{state.message}</p>}</form>;
}

export function ReleaseResult({ id, released }: { id: string; released: boolean }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function change() { setBusy(true); setError(""); try { const result = await setResultReleased(id, !released); setError(result.error); if (!result.error) router.refresh(); } catch { setError("Could not update visibility. Try again."); } finally { setBusy(false); } }
  return <span className={styles.release}><span>{released ? "Released" : "Not released"}</span><button type="button" disabled={busy} onClick={change}>{busy ? "Updating…" : released ? "Hide from student" : "Release to student"}</button>{error && <span role="alert">{error}</span>}</span>;
}

export function AnswerVisibility({ id, visible }: { id: string; visible: boolean }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function change() { setBusy(true); setError(""); try { const result = await setCorrectAnswersVisible(id, !visible); setError(result.error); if (!result.error) router.refresh(); } catch { setError("Could not update answer visibility."); } finally { setBusy(false); } }
  return <div className={styles.release}><span>Correct answers: {visible ? "visible to student" : "hidden from student"}</span><button type="button" disabled={busy} onClick={change}>{busy ? "Updating…" : visible ? "Hide correct answers" : "Show correct answers"}</button>{error && <span role="alert">{error}</span>}</div>;
}
