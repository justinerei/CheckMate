"use client";
import styles from "./quiz-editor.module.css";

export default function CancelSectionButton() {
  return <button type="button" className={styles.secondaryButton} onClick={event => { const form = event.currentTarget.form; form?.reset(); const disclosure = form?.closest("details"); if (disclosure) disclosure.open = false; }}>Cancel</button>;
}
