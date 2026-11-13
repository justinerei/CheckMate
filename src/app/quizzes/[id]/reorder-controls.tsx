"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./reorder-controls.module.css";

type Drag = { pointerId: number; active: boolean; target: string | null; targetElement: HTMLElement | null; timer: ReturnType<typeof setTimeout> | null };
export default function ReorderControls({ id, label, first, last, disabled, onMove }: { id: string; label: string; first: boolean; last: boolean; disabled?: boolean; onMove: (id: string, destination: string | number) => void }) {
  const drag = useRef<Drag | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => () => { if (drag.current?.timer) clearTimeout(drag.current.timer); if (drag.current?.targetElement) delete drag.current.targetElement.dataset.reorderTarget; }, []);
  function clear() {
    if (drag.current?.timer) clearTimeout(drag.current.timer);
    if (drag.current?.targetElement) delete drag.current.targetElement.dataset.reorderTarget;
    drag.current = null;
    setActive(false);
  }
  function down(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const state: Drag = { pointerId: event.pointerId, active: event.pointerType !== "touch", target: null, targetElement: null, timer: null };
    drag.current = state;
    if (state.active) setActive(true);
    else state.timer = setTimeout(() => { if (drag.current === state) { state.active = true; setActive(true); } }, 250);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state?.active || state.pointerId !== event.pointerId) return;
    const list = event.currentTarget.closest("[data-reorder-list]");
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-reorder-id]");
    const target = element && list?.contains(element) ? element : null;
    if (state.targetElement !== target) {
      if (state.targetElement) delete state.targetElement.dataset.reorderTarget;
      state.targetElement = target;
      state.target = target?.dataset.reorderId ?? null;
      if (target) target.dataset.reorderTarget = "true";
    }
    if (event.clientY < 70) window.scrollBy(0, -12);
    else if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
  }
  function up(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (state?.active && state.pointerId === event.pointerId && state.target && state.target !== id) onMove(id, state.target);
    clear();
  }
  return <div className={styles.controls} aria-label={`Reorder ${label}`}>
    <button type="button" className={`${styles.handle} ${active ? styles.active : ""}`} aria-label={`Drag ${label}; hold and move on touchscreens`} title="Hold and drag to move" disabled={disabled} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={clear} onLostPointerCapture={clear} onContextMenu={event => event.preventDefault()}>⠿ <span>Drag</span></button>
    <button type="button" className={styles.arrow} aria-label={`Move ${label} up`} title="Move up" disabled={disabled || first} onClick={() => onMove(id, -1)}>↑</button>
    <button type="button" className={styles.arrow} aria-label={`Move ${label} down`} title="Move down" disabled={disabled || last} onClick={() => onMove(id, 1)}>↓</button>
  </div>;
}
