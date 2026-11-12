/** Compute pinch zoom from the two-finger distance at the beginning of the gesture. */
export function pinchZoom(startZoom: number, startDistance: number, distance: number) {
  if (startDistance <= 0 || distance <= 0) return startZoom;
  return Math.round(Math.max(100, Math.min(400, startZoom * distance / startDistance)));
}

/** Width that fits the entire image in the available viewport. */
export function fitPhotoWidth(viewWidth: number, viewHeight: number, imageWidth: number, imageHeight: number) {
  if (viewWidth <= 0 || viewHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return 0;
  return Math.min(viewWidth, viewHeight * imageWidth / imageHeight);
}

/** Keep the point beneath the fingers fixed, accounting for horizontal centering. */
export function zoomOffset(scroll: number, anchor: number, oldZoom: number, newZoom: number, oldInset = 0, newInset = 0) {
  return Math.max(0, (scroll + anchor - oldInset) * newZoom / oldZoom + newInset - anchor);
}
