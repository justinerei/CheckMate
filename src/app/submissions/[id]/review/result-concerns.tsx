"use client";
import { useActionState } from "react";
import { answerResultConcern } from "@/app/student/actions";
import styles from "../../submissions.module.css";

type Concern = { id: string; label: string; message: string; response: string | null; resolved: boolean; currentStudent: boolean };
function ConcernResponse({ concern }: { concern: Concern }) {
  const [state, action, pending] = useActionState(answerResultConcern.bind(null, concern.id), { message: "", ok: false });
  return <article><h3>{concern.label} · {concern.resolved ? "Answered" : "Waiting for response"}</h3>{!concern.currentStudent && <p>Sent by a previously linked student.</p>}<p>{concern.message}</p>{concern.response ? <p>Your response: {concern.response}</p> : <form action={action}><label>Response<textarea name="response" rows={3} maxLength={1000} required /></label><button type="submit" className={styles.secondary} disabled={pending}>{pending ? "Sending…" : "Send response"}</button>{state.message && <p role="status">{state.message}</p>}</form>}</article>;
}
export default function ResultConcerns({ concerns }: { concerns: Concern[] }) {
  if (!concerns.length) return null;
  return <section className={styles.keyPanel}><h2>Student concerns</h2><p>Responses appear to the student when their result is released.</p>{concerns.map(concern => <ConcernResponse concern={concern} key={concern.id} />)}</section>;
}
