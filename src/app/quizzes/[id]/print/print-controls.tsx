"use client";
import { useState } from "react";
import styles from "./print.module.css";

export default function PrintControls({ pageSize, code }: { pageSize: string; code: string }) {
  const [labels, setLabels] = useState(true);
  const footer = labels ? `@bottom-right { content: '${code}  ·  Page ' counter(page) ' of ' counter(pages); font: 8pt Arial, sans-serif; color: #555; }` : "";
  return <><style>{`@page { size: ${pageSize}; margin: 16mm; ${footer} }`}</style><div className={styles.controls}><label><input type="checkbox" checked={labels} onChange={event => setLabels(event.target.checked)} /> Include page labels</label><button type="button" onClick={() => window.print()}>Print / Save as PDF</button></div><p className={styles.hint}>Pages are arranged automatically. Open the print dialog to check the actual page breaks. Page labels help identify multi-page papers; for a one-page quiz, you can turn them off. Use an up-to-date Chrome, Edge, or Brave browser and turn off browser headers and footers. The code identifies the quiz, not the version: after edits, reprint all pages.</p></>;
}
