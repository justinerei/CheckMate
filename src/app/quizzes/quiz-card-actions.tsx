"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/submissions/confirm-dialog";
import { deleteQuiz, setQuizArchived } from "./delete-actions";
import styles from "./quiz-card-actions.module.css";

type Quiz = { id: string; title: string; archived: boolean; papers: number };
type Choice = "archive" | "delete";

export default function QuizCardActions({ quiz }: { quiz: Quiz }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const menu = useRef<HTMLDetailsElement>(null);
  const router = useRouter();

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  async function change(action: Choice | "restore") {
    setChoice(null);
    setBusy(true);
    setError("");
    try {
      const result = action === "delete" ? await deleteQuiz(quiz.id) : await setQuizArchived(quiz.id, action === "archive");
      if (result.error) setError(result.error);
      else router.refresh();
    } catch {
      setError("Could not update this quiz. Refresh and try again.");
    } finally {
      setBusy(false);
    }
  }

  function select(action: Choice | "restore") {
    if (menu.current) menu.current.open = false;
    if (action === "restore") void change(action);
    else setChoice(action);
  }

  return <div className={styles.actions}>
    <details ref={menu} className={styles.menu} onKeyDown={event => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label={`More options for ${quiz.title}`} title="Quiz options">⋯</summary>
      <div className={styles.dropdown}>
        <button type="button" disabled={busy} onClick={() => select(quiz.archived ? "restore" : "archive")}>{quiz.archived ? "Restore quiz" : "Archive quiz"}</button>
        {quiz.papers === 0 && <button type="button" className={styles.delete} disabled={busy} onClick={() => select("delete")}>Delete quiz</button>}
        {quiz.papers > 0 && <span className={styles.hint}>Quizzes with papers can be archived.</span>}
      </div>
    </details>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {choice && <ConfirmDialog mascot destructive={choice === "delete"} title={`${choice === "archive" ? "Archive" : "Delete"} ${quiz.title}?`} message={choice === "archive" ? "This moves the quiz to Archived quizzes and keys. Its papers and scores stay available, and you can restore it anytime." : "This permanently deletes the quiz, its questions, answer key, uploaded modules, and any empty batches. This cannot be undone."} confirmLabel={choice === "archive" ? "Archive quiz" : "Delete quiz"} onCancel={() => setChoice(null)} onConfirm={() => void change(choice)} />}
  </div>;
}
