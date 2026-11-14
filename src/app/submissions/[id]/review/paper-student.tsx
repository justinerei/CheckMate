"use client";
import Link from "next/link";
import { useActionState } from "react";
import { assignPaperStudent } from "./student-actions";
import styles from "../../submissions.module.css";

type Student = { id: string; name: string; codeSuffix: string };
export default function PaperStudent({ id, selectedId, selectedName, students, finalized }: { id: string; selectedId: string | null; selectedName: string | null; students: Student[]; finalized: boolean }) {
  const [state, action, pending] = useActionState(assignPaperStudent.bind(null, id), { message: "", ok: false });
  return <details className={styles.nameStrip}><summary>{selectedName ? `Linked student · ${selectedName}` : "Link to a student · optional"}</summary><div className={styles.paperStudent}>
    <p>Link this paper to a student in your list. The name written on the paper is confirmed separately. The last four characters of the sharing code help distinguish students with the same name.</p>
    {finalized ? <p>{selectedName ? `Linked to ${selectedName}.` : "No student linked."} Reopen this paper to change the link.</p> : students.length ? <form action={action} className={styles.answerForm} key={selectedId ?? "unlinked"}>
      <label>Student record<select className={styles.keyInput} name="studentId" defaultValue={selectedId ?? ""}><option value="">No student linked</option>{students.map(student => <option key={student.id} value={student.id}>{student.name} · {student.codeSuffix}</option>)}</select></label>
      <button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Save student link"}</button>{state.message && <p role="status" className={state.ok ? styles.success : styles.error}>{state.message}</p>}
    </form> : <p>No students in your list yet. <Link href="/students">Open student list</Link>, add a student, then return here.</p>}
  </div></details>;
}
