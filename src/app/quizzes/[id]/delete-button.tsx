"use client";
import { useFormStatus } from "react-dom";
import { PendingScreen } from "@/app/pending-screen";

export default function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <><PendingScreen pending={pending} message="Deleting…" /><button disabled={pending} type="submit" onClick={event => { if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) event.preventDefault(); }}>{pending ? "Deleting…" : `Delete ${label}`}</button></>;
}
