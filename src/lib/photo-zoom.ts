/** Compute pinch zoom from the two-finger distance at the beginning of the gesture. */
export function pinchZoom(startZoom: number, startDistance: number, distance: number) {
  if (startDistance <= 0 || distance <= 0) return startZoom;
  return Math.round(Math.max(100, Math.min(400, startZoom * distance / startDistance)));
}

/** Keep the point beneath the fingers fixed as the image changes size. */
export function zoomOffset(scroll: number, anchor: number, oldZoom: number, newZoom: number) {
  return Math.max(0, (scroll + anchor) * newZoom / oldZoom - anchor);
}
