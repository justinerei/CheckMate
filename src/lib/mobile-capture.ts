/** Mobile operating systems are suited to photographing a paper; desktop webcams are not. */
export function isMobileCaptureDevice(userAgent: string, platform: string, maxTouchPoints: number, mobileHint?: boolean): boolean {
  if (mobileHint === true) return true;
  return /Android|iPhone|iPad|iPod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}
