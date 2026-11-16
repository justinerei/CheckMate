"use client";
import { useEffect, useRef, useState } from "react";
import { clipboardImages, isTextEditingTarget } from "@/lib/clipboard-images";
import UploadIcon from "@/app/upload-icon";
import styles from "./submissions.module.css";

type Props = { title: string; description: string; formats: string; accept: string; disabled?: boolean; hidden?: boolean; onFiles: (files: File[]) => void; onCamera?: () => void; showCamera?: boolean };
export default function FileDropzone({ title, description, formats, accept, disabled = false, hidden = false, onFiles, onCamera, showCamera = true }: Props) {
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
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (disabled || event.defaultPrevented || isTextEditingTarget(event.target) || document.querySelector("dialog[open]")) return;
      const files = clipboardImages(event.clipboardData?.items ?? []);
      if (!files.length) return;
      event.preventDefault(); onFilesRef.current(files);
    };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }, [disabled]);
  function select(event: React.ChangeEvent<HTMLInputElement>) { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; if (files.length) onFiles(files); }
  return <>
    <section className={styles.dropzone} aria-label={title} hidden={hidden}>
      <div className={styles.dropIcon} aria-hidden="true"><UploadIcon /></div>
      <h3>{title}</h3><p>{description}</p>
      <div className={styles.dropActions}><label className={styles.photoFileButton}><span>Choose files</span><input type="file" accept={accept} multiple disabled={disabled} onChange={select} aria-label={`Choose files: ${title}`} /></label>{showCamera && (onCamera ? <button type="button" className={styles.secondary} disabled={disabled} onClick={onCamera}>Open camera</button> : <label className={styles.cameraFileButton}><span>Take a photo</span><input type="file" accept="image/jpeg,image/png" capture="environment" disabled={disabled} onChange={select} aria-label={`Take a photo: ${title}`} /></label>)}</div>
      <span className={styles.dropFormats}>{formats} · On a computer, paste a screenshot with Ctrl+V.</span>
    </section>
    <div className={`${styles.dropOverlay} ${dragging && !disabled ? styles.dropOverlayVisible : ""}`} aria-hidden="true"><div className={styles.dropOverlayFrame}><div className={styles.dropOverlayContent}><span className={styles.dropOverlayIcon}><UploadIcon /></span><strong>Drop your files here</strong><p>{formats}</p></div></div></div>
  </>;
}
