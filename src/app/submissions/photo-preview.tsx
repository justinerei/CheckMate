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
  const viewport = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, [open]);

  useEffect(() => {
    if (!open || !viewport.current) return;
    const area = viewport.current;
    let distance = 0, startZoom = 100, lastX = 0, lastY = 0;
    const gap = (touches: TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const start = (event: TouchEvent) => {
      if (event.touches.length === 2) { distance = gap(event.touches); startZoom = zoomRef.current; }
      if (event.touches.length === 1) { lastX = event.touches[0].clientX; lastY = event.touches[0].clientY; }
    };
    const move = (event: TouchEvent) => {
      if (event.touches.length === 2 && distance) {
        event.preventDefault();
        setZoom(Math.round(Math.max(100, Math.min(400, startZoom * gap(event.touches) / distance))));
      } else if (event.touches.length === 1) {
        event.preventDefault();
        const touch = event.touches[0];
        area.scrollLeft += lastX - touch.clientX; area.scrollTop += lastY - touch.clientY;
        lastX = touch.clientX; lastY = touch.clientY;
      }
    };
    const end = (event: TouchEvent) => { distance = 0; if (event.touches.length === 1) { lastX = event.touches[0].clientX; lastY = event.touches[0].clientY; } };
    area.addEventListener("touchstart", start, { passive: false }); area.addEventListener("touchmove", move, { passive: false }); area.addEventListener("touchend", end);
    return () => { area.removeEventListener("touchstart", start); area.removeEventListener("touchmove", move); area.removeEventListener("touchend", end); };
  }, [open]);

  function close() { setOpen(false); setZoom(100); requestAnimationFrame(() => trigger.current?.focus()); }
  return <>
    <button ref={trigger} type="button" className={styles.photoPreviewButton} onClick={() => setOpen(true)} aria-label={`View ${alt}`}>
      {/* These photos can be private API URLs or temporary camera blob URLs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={className} src={src} alt={alt} onError={onError} onLoad={onLoad} />
      <span className={styles.photoPreviewHint}>View photo</span>
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
      <p className={styles.photoViewerHelp}>Pinch or use the controls to zoom. Swipe or scroll to move.</p>
      <div ref={viewport} className={styles.photoViewerViewport} tabIndex={0} aria-label="Scrollable enlarged photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: `${zoom}%` }} />
      </div>
    </dialog>, document.body)}
  </>;
}
