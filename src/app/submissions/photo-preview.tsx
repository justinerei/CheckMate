"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./submissions.module.css";

type Props = { src: string; alt: string; className?: string; onError?: () => void; onLoad?: () => void };

export default function PhotoPreview({ src, alt, className, onError, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, [open]);

  function close() { setOpen(false); setZoom(100); requestAnimationFrame(() => trigger.current?.focus()); }
  return <>
    <button ref={trigger} type="button" className={styles.photoPreviewButton} onClick={() => setOpen(true)} aria-label={`Enlarge ${alt}`}>
      {/* These photos can be private API URLs or temporary camera blob URLs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={className} src={src} alt={alt} onError={onError} onLoad={onLoad} />
      <span className={styles.photoPreviewHint}>Enlarge photo</span>
    </button>
    {open && createPortal(<dialog ref={dialog} className={styles.photoViewer} aria-label={`Enlarged ${alt}`} onCancel={event => { event.preventDefault(); close(); }}>
      <div className={styles.photoViewerHeader}>
        <strong>{alt}</strong>
        <button type="button" className={styles.secondary} onClick={close}>Close</button>
      </div>
      <div className={styles.photoViewerTools} aria-label="Photo zoom controls">
        <button type="button" className={styles.secondary} aria-label="Zoom out" disabled={zoom <= 100} onClick={() => setZoom(value => Math.max(100, value - 50))}>−</button>
        <span aria-live="polite">{zoom}%</span>
        <button type="button" className={styles.secondary} aria-label="Zoom in" disabled={zoom >= 400} onClick={() => setZoom(value => Math.min(400, value + 50))}>+</button>
        <button type="button" className={styles.secondary} onClick={() => setZoom(100)}>Fit</button>
      </div>
      <p className={styles.photoViewerHelp}>Use + or − to zoom. Scroll or swipe to move around the photo.</p>
      <div className={styles.photoViewerViewport} tabIndex={0} aria-label="Scrollable enlarged photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: `${zoom}%` }} />
      </div>
    </dialog>, document.body)}
  </>;
}
