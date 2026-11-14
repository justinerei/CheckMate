"use client";
import Link from "next/link";
import styles from "../../submissions.module.css";
import { paperBackDestination, paperOrigin } from "@/lib/back-navigation";

export default function ReviewBackLink({ id, quizId, batchId, from, finalized }: { id: string; quizId: string; batchId: string | null; from?: string; finalized: boolean }) {
  const { href: destination, label } = paperBackDestination({ id, quizId, batchId }, from);
  return <Link href={destination} className="back-navigation" onClick={event => { if (!finalized && !window.confirm("Leave this review? Any answer or name changes you have not confirmed will be lost.")) event.preventDefault(); }}>{label}</Link>;
}

export function ReviewPhotosLink({ id, from }: { id: string; from?: string }) {
  return <Link href={`/submissions/${encodeURIComponent(id)}?from=review${paperOrigin(from) ? `&origin=${paperOrigin(from)}` : ""}`} className={styles.reviewPhotoLink} onClick={event => { if (!window.confirm("Go to paper photos? Any answer or name changes you have not confirmed will be lost.")) event.preventDefault(); }}>Manage paper photos</Link>;
}
