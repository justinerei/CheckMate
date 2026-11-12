"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./submissions.module.css";

type Props = { title: string; description: string; formats: string; accept: string; disabled?: boolean; hidden?: boolean; onFiles: (files: File[]) => void; onCamera?: () => void };
export default function FileDropzone({ title, description, formats, accept, disabled = false, hidden = false, onFiles, onCamera }: Props) {
  const [dragging, setDragging] = useState(false);
  const onFilesRef = useRef(onFiles);
  useEffect(() => { onFilesRef.current = onFiles; }, [onFiles]);
  useEffect(() => {
    let depth = 0;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    const isFile = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const enter = (event: DragEvent) => { if (!isFile(event)) return; event.preventDefault(); if (!disabled) { clearTimeout(leaveTimer); depth++; setDragging(true); } };
    const over = (event: DragEvent) => { if (!isFile(event)) return; event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = disabled ? "none" : "copy"; };
    const leave = (event: DragEvent) => { if (!isFile(event)) return; depth = Math.max(0, depth - 1); if (!depth) leaveTimer = setTimeout(() => setDragging(false), 100); };
    const drop = (event: DragEvent) => { if (!isFile(event)) return; event.preventDefault(); depth = 0; clearTimeout(leaveTimer); setDragging(false); const files = Array.from(event.dataTransfer?.files ?? []); if (!disabled && files.length) onFilesRef.current(files); };
    const reset = () => { depth = 0; clearTimeout(leaveTimer); setDragging(false); };
    window.addEventListener("dragenter", enter); window.addEventListener("dragover", over); window.addEventListener("dragleave", leave); window.addEventListener("drop", drop); window.addEventListener("blur", reset);
    return () => { clearTimeout(leaveTimer); window.removeEventListener("dragenter", enter); window.removeEventListener("dragover", over); window.removeEventListener("dragleave", leave); window.removeEventListener("drop", drop); window.removeEventListener("blur", reset); };
  }, [disabled]);
  function select(event: React.ChangeEvent<HTMLInputElement>) { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; if (files.length) onFiles(files); }
  return <>
    <section className={styles.dropzone} aria-label={title} hidden={hidden}>
      <div className={styles.dropIcon} aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg></div>
      <h3>{title}</h3><p>{description}</p>
      <div className={styles.dropActions}><label className={styles.photoFileButton}><span>Choose files</span><input type="file" accept={accept} multiple disabled={disabled} onChange={select} aria-label={`Choose files: ${title}`} /></label>{onCamera ? <button type="button" className={styles.secondary} disabled={disabled} onClick={onCamera}>Open camera</button> : <label className={styles.cameraFileButton}><span>Take a photo</span><input type="file" accept="image/jpeg,image/png" capture="environment" disabled={disabled} onChange={select} aria-label={`Take a photo: ${title}`} /></label>}</div>
      <span className={styles.dropFormats}>{formats}</span>
    </section>
    <div className={`${styles.dropOverlay} ${dragging && !disabled ? styles.dropOverlayVisible : ""}`} aria-hidden="true"><div className={styles.dropOverlayFrame}><div className={styles.dropOverlayContent}><span className={styles.dropOverlayIcon}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m-4 4 4-4 4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></span><span className={styles.dropOverlayEyebrow}>READY TO UPLOAD</span><strong>Drop your files here</strong><p>{formats}</p></div></div></div>
  </>;
}
