"use client";
import Link from "next/link";
import styles from "../../submissions.module.css";

export default function ReviewBackLink({ id, batchId, finalized }: { id: string; batchId: string | null; finalized: boolean }) {
  const destination = batchId ? `/batches/${encodeURIComponent(batchId)}` : finalized ? "/submissions" : `/submissions/${encodeURIComponent(id)}`;
  const label = batchId ? "Back to batch" : finalized ? "Back to student papers" : "Back to paper photos";
  return <Link href={destination} className="back-navigation" onClick={event => { if (!finalized && !window.confirm("Leave this review? Any answer or name changes you have not confirmed will be lost.")) event.preventDefault(); }}>{label}</Link>;
}

export function ReviewPhotosLink({ id }: { id: string }) {
  return <Link href={`/submissions/${encodeURIComponent(id)}`} className={styles.reviewPhotoLink} onClick={event => { if (!window.confirm("Go to paper photos? Any answer or name changes you have not confirmed will be lost.")) event.preventDefault(); }}>Manage paper photos</Link>;
}
