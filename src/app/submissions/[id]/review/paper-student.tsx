"use client";
import { PendingScreen } from "@/app/pending-screen";
import Link from "next/link";
import { useActionState, useState } from "react";
import { assignPaperStudent } from "./student-actions";
import styles from "../../submissions.module.css";

type Student = { id: string; name: string; codeSuffix: string; classes: { id: string; name: string }[] };
export default function PaperStudent({ id, selectedId, selectedName, students }: { id: string; selectedId: string | null; selectedName: string | null; students: Student[] }) {
  const [state, action, pending] = useActionState(assignPaperStudent.bind(null, id), { message: "", ok: false });
  const [classId, setClassId] = useState("");
  const classes = Array.from(new Map(students.flatMap(student => student.classes).map(classroom => [classroom.id, classroom])).values());
  const visible = classId ? students.filter(student => student.classes.some(classroom => classroom.id === classId) || student.id === selectedId) : students;
  return <details className={styles.nameStrip}><summary>{selectedName ? `Linked student · ${selectedName}` : "Link to a student · optional"}</summary><div className={styles.paperStudent}>
    <p>Link this paper to a student in your list. The name written on the paper is confirmed separately. The last four characters of the sharing code help distinguish students with the same name.</p>
    {students.length ? <form action={action} className={styles.answerForm} key={selectedId ?? "unlinked"}><PendingScreen pending={pending} message="Saving the student link…" />
      {classes.length > 0 && <label>Class<select className={styles.keyInput} value={classId} onChange={event => setClassId(event.target.value)}><option value="">All students</option>{classes.map(classroom => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}</select></label>}
      <label>Student record<select className={styles.keyInput} name="studentId" defaultValue={selectedId ?? ""} key={classId}><option value="">No student linked</option>{visible.map(student => <option key={student.id} value={student.id}>{student.name} · {student.codeSuffix}</option>)}</select></label>
      <button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Save student link"}</button>{state.message && <p role="status" className={state.ok ? styles.success : styles.error}>{state.message}</p>}
    </form> : <p>No students in your list yet. <Link href="/students">Open student list</Link>, add a student, then return here.</p>}
  </div></details>;
}
