"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAccountEnabled } from "./actions";

export default function AccountControl({ id, enabled }: { id: string; enabled: boolean }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function update() { if (enabled && !window.confirm("Disable this account's access to CheckMate? Its records will be kept.")) return; setBusy(true); setError(""); try { const result = await setAccountEnabled(id, !enabled); setError(result.error); if (!result.error) router.refresh(); } catch { setError("Could not update account. Try again."); } finally { setBusy(false); } }
  return <span><button type="button" disabled={busy} onClick={update}>{busy ? "Updating…" : enabled ? "Disable access" : "Enable access"}</button>{error && <span role="alert">{error}</span>}</span>;
}
