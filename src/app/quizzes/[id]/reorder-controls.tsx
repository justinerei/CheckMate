"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { flushSync } from "react-dom";
import styles from "./reorder-controls.module.css";

type Drag = {
  pointerId: number; active: boolean; timer: ReturnType<typeof setTimeout> | null;
  source: HTMLElement; rows: HTMLElement[]; from: number; to: number;
  startY: number; y: number; top: number; left: number;
  ghost: HTMLElement | null; centers: number[]; height: number; scrollFrame: number | null;
};
function reducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function restoreRows(state: Drag) {
  for (const row of state.rows) { row.style.removeProperty("transform"); row.style.removeProperty("transition"); }
}
function shiftRows(state: Drag) {
  let closest = state.from, distance = Infinity;
  state.rows.forEach((_, index) => {
    const center = state.centers[index] - window.scrollY;
    if (Math.abs(state.y - center) < distance) { distance = Math.abs(state.y - center); closest = index; }
  });
  if (closest === state.to) return;
  state.to = closest;
  state.rows.forEach((row, index) => {
    const shift = index > state.from && index <= closest ? -state.height : index < state.from && index >= closest ? state.height : 0;
    if (row !== state.source) { row.style.transition = reducedMotion() ? "none" : "transform 180ms ease"; row.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : ""; }
  });
}
export default function ReorderControls({ id, label, first, last, disabled, onMove }: { id: string; label: string; first: boolean; last: boolean; disabled?: boolean; onMove: (id: string, destination: string | number) => void }) {
  const drag = useRef<Drag | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => () => { const state = drag.current; if (state?.timer) clearTimeout(state.timer); if (state?.scrollFrame !== null && state?.scrollFrame !== undefined) cancelAnimationFrame(state.scrollFrame); if (state) { restoreRows(state); delete state.source.dataset.reorderSource; state.ghost?.remove(); } }, []);
  function clear() {
    const state = drag.current;
    if (state?.timer) clearTimeout(state.timer);
    if (state?.scrollFrame !== null && state?.scrollFrame !== undefined) cancelAnimationFrame(state.scrollFrame);
    if (state) { restoreRows(state); delete state.source.dataset.reorderSource; state.ghost?.remove(); }
    drag.current = null;
    setActive(false);
  }
  function lift(state: Drag) {
    if (drag.current !== state) return;
    const rect = state.source.getBoundingClientRect();
    const copy = state.source.cloneNode(true) as HTMLElement;
    copy.removeAttribute("id");
    Object.assign(copy.style, { width: "100%", height: "100%", margin: "0", boxSizing: "border-box" });
    // Preserve form-scoped field styles when the lifted card is outside the original list.
    const ghost = document.createElement("div");
    ghost.className = state.source.closest("form")?.className ?? "";
    ghost.classList.add(styles.ghost);
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    ghost.appendChild(copy);
    Object.assign(ghost.style, { position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: "0", padding: "0", display: "block", color: getComputedStyle(state.source).color, zIndex: "9999", pointerEvents: "none", boxSizing: "border-box" });
    document.body.appendChild(ghost);
    state.top = rect.top; state.left = rect.left; state.height = rect.height;
    state.centers = state.rows.map(row => { const box = row.getBoundingClientRect(); return box.top + window.scrollY + box.height / 2; });
    state.ghost = ghost; state.active = true;
    state.source.dataset.reorderSource = "true";
    setActive(true);
    ghost.style.transform = `translate3d(0, ${state.y - state.startY}px, 0) scale(1.015)`;
  }
  function down(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    const source = event.currentTarget.closest<HTMLElement>("[data-reorder-id]");
    const list = event.currentTarget.closest<HTMLElement>("[data-reorder-list]");
    if (!source || !list || source.dataset.reorderSource === "true") return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-reorder-id]"));
    const from = rows.indexOf(source);
    if (from < 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const state: Drag = { pointerId: event.pointerId, active: false, timer: null, source, rows, from, to: from, startY: event.clientY, y: event.clientY, top: 0, left: 0, ghost: null, centers: [], height: 0, scrollFrame: null };
    drag.current = state;
    if (event.pointerType === "touch") state.timer = setTimeout(() => lift(state), 250);
    else lift(state);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    state.y = event.clientY;
    if (!state.active || !state.ghost) return;
    state.ghost.style.transform = `translate3d(0, ${state.y - state.startY}px, 0) scale(1.015)`;
    shiftRows(state);
    if (state.scrollFrame === null && (state.y < 70 || state.y > window.innerHeight - 70)) {
      const scroll = () => {
        if (drag.current !== state || !state.active) return;
        const direction = state.y < 70 ? -1 : state.y > window.innerHeight - 70 ? 1 : 0;
        if (!direction) { state.scrollFrame = null; return; }
        const before = window.scrollY;
        window.scrollBy(0, direction * 10);
        if (window.scrollY === before) { state.scrollFrame = null; return; }
        shiftRows(state);
        state.scrollFrame = requestAnimationFrame(scroll);
      };
      state.scrollFrame = requestAnimationFrame(scroll);
    }
  }
  function up(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (!state.active || !state.ghost || state.to === state.from) { clear(); return; }
    const destination = state.rows[state.to].dataset.reorderId;
    if (!destination) { clear(); return; }
    const ghost = state.ghost;
    const fromTransform = ghost.style.transform;
    if (state.scrollFrame !== null) cancelAnimationFrame(state.scrollFrame);
    // Detach the pointer state before React moves the source node and releases pointer capture.
    state.ghost = null;
    drag.current = null;
    setActive(false);
    flushSync(() => onMove(id, destination));
    restoreRows(state);
    const end = state.source.getBoundingClientRect();
    let finished = false;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (fallback) clearTimeout(fallback);
      ghost.remove();
      delete state.source.dataset.reorderSource;
    };
    if (reducedMotion()) { finish(); return; }
    try {
      const animation = ghost.animate([{ transform: fromTransform, opacity: 1 }, { transform: `translate3d(${end.left - state.left}px, ${end.top - state.top}px, 0) scale(1)`, opacity: 1 }], { duration: 160, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
      animation.onfinish = finish;
      animation.oncancel = finish;
      fallback = setTimeout(finish, 300);
    } catch { finish(); }
  }
  return <div className={styles.controls} aria-label={`Reorder ${label}`}>
    <button type="button" className={`${styles.handle} ${active ? styles.active : ""}`} aria-label={`Hold and move ${label}`} title="Hold and move" disabled={disabled} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={clear} onLostPointerCapture={clear} onContextMenu={event => event.preventDefault()}>⠿</button>
    <button type="button" className={styles.arrow} aria-label={`Move ${label} up`} title="Move up" disabled={disabled || first} onClick={() => onMove(id, -1)}>↑</button>
    <button type="button" className={styles.arrow} aria-label={`Move ${label} down`} title="Move down" disabled={disabled || last} onClick={() => onMove(id, 1)}>↓</button>
  </div>;
}
