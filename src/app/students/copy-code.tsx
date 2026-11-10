"use client";
import { useState } from "react";
import styles from "./students.module.css";

export default function CopyCode({ code }: { code: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(code); setMessage("Code copied."); }
    catch { setMessage("Could not copy. Select the code and copy it manually."); }
  }
  return <div className={styles.codeActions}><code>{code}</code><button type="button" onClick={copy}>Copy code</button><span role="status">{message}</span></div>;
}
