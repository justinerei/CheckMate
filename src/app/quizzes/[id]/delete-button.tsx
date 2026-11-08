"use client";

export default function DeleteButton({ label }: { label: string }) {
  return <button type="submit" onClick={event => { if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) event.preventDefault(); }}>Delete {label}</button>;
}
