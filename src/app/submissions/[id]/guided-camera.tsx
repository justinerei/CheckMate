"use client";

import { useEffect, useRef, useState } from "react";
import Mascot from "@/app/mascot";
import styles from "../submissions.module.css";
import PhotoPreview from "../photo-preview";
import ConfirmDialog from "../confirm-dialog";

type Capture = { file: File; url: string; warning: string };
type Props = { pageNumbers: number[]; onClose: () => void; onUpload: (files: File[]) => Promise<void>; kind?: "student" | "answer-key" };

// Local, deliberately conservative checks: neither result verifies document contents.
function photoWarning(canvas: HTMLCanvasElement): string {
  const sample = document.createElement("canvas");
  sample.width = 160; sample.height = Math.max(1, Math.round(160 * canvas.height / canvas.width));
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";
  ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
  const { data } = ctx.getImageData(0, 0, sample.width, sample.height);
  let total = 0, edges = 0, count = 0;
  const gray = (i: number) => (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  for (let y = 1; y < sample.height; y++) for (let x = 1; x < sample.width; x++) {
    const i = (y * sample.width + x) * 4, value = gray(i);
    total += value; edges += Math.abs(value - gray(i - 4)); count++;
  }
  if (total / count < 45) return "This photo looks dark. Try better lighting, or check it carefully before using it.";
  if (edges / count < 2) return "This photo may be blurry. Make sure the writing is readable before using it.";
  return "";
}

export default function GuidedCamera({ pageNumbers, onClose, onUpload, kind = "student" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef<Capture[]>([]);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [current, setCurrent] = useState(0);
  const [preview, setPreview] = useState<Capture | null>(null);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [torchSupported, setTorchSupported] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchBusy, setTorchBusy] = useState(false);
  const [torchMessage, setTorchMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) { setError("Open this page using HTTPS or localhost, then try again. You can also close the camera and choose an existing photo."); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        try {
          const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean | boolean[] }) | undefined;
          setTorchSupported(capabilities?.torch === true || (Array.isArray(capabilities?.torch) && capabilities.torch.includes(true)));
        } catch { setTorchSupported(false); }
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch { if (!cancelled) setError("Allow camera access in your browser settings, then tap Try camera again. If it still does not open, close the camera and choose an existing photo."); }
    }
    start();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(track => track.stop()); };
  }, [cameraAttempt]);
  useEffect(() => { capturesRef.current = captures; }, [captures]);
  useEffect(() => () => { capturesRef.current.forEach(item => item && URL.revokeObjectURL(item.url)); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  async function toggleTorch(next: boolean) {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || torchBusy) return;
    setTorchBusy(true); setTorchMessage("");
    try {
      const torchConstraint = { torch: next } as MediaTrackConstraintSet & { torch: boolean };
      await track.applyConstraints({ ...track.getConstraints(), advanced: [torchConstraint] });
      const actual = track.getSettings() as MediaTrackSettings & { torch?: boolean };
      if (typeof actual.torch === "boolean" && actual.torch !== next) {
        setTorchOn(actual.torch);
        setTorchMessage("The camera could not change the light. Try better lighting or use your camera app.");
      } else setTorchOn(next);
    } catch {
      setTorchMessage("Could not change the camera light. Try better lighting or use your camera app.");
    } finally { setTorchBusy(false); }
  }
  function close() {
    if (captures.length || preview) { setConfirmClose(true); return; }
    onClose();
  }
  async function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) { setError("Camera is still starting. Tap Try camera again, or close it and choose an existing photo."); return; }
    setError("");
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 2400 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { setError("Could not capture the photo. Please try again."); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const warning = photoWarning(canvas);
    if (torchOn) await toggleTorch(false);
    canvas.toBlob(blob => {
      if (!blob) { setError("Could not capture the photo. Please try again."); return; }
      setPreview({ file: new File([blob], `page-${pageNumbers[current]}.jpg`, { type: "image/jpeg" }), url: URL.createObjectURL(blob), warning });
    }, "image/jpeg", 0.85);
  }
  function usePhoto() {
    if (!preview) return;
    // Keep the URL alive after leaving the preview.
    const saved = { ...preview, url: URL.createObjectURL(preview.file) };
    const next = [...captures];
    if (next[current]) URL.revokeObjectURL(next[current].url);
    next[current] = saved; setCaptures(next); setPreview(null);
    const missing = pageNumbers.findIndex((_, index) => !next[index]);
    if (missing === -1) setReview(true); else setCurrent(missing);
  }
  async function upload() { setBusy(true); try { await onUpload(captures.map(item => item.file)); onClose(); } finally { setBusy(false); } }
  return <div className={styles.cameraOverlay} role="dialog" aria-modal="true" aria-labelledby="camera-title">
    <div className={styles.cameraPanel}>
      <div className={styles.cameraHeader}><div><span className={styles.eyebrow}>{kind === "answer-key" ? "ANSWER KEY" : "STUDENT PAPER"}</span><h2 id="camera-title">{review ? "Review your photos" : `Page ${pageNumbers[current]} of ${pageNumbers[pageNumbers.length - 1]}`}</h2></div><button type="button" className={styles.secondary} onClick={close} disabled={busy}>Close</button></div>
      <p className={styles.cameraHelp}>{review ? "Check that each photo is clear and matches its page number." : preview ? "Check that the whole page and answers are readable." : "Fit the whole page in view, then tap Capture."}</p>
      {error && <div role="alert" className={styles.feedbackNotice}><Mascot state="concerned" width={48} height={48} className={styles.feedbackMascot} /><div><strong>Camera needs attention</strong><p>{error}</p><button type="button" className={styles.secondary} onClick={() => { setError(""); setTorchSupported(null); setTorchOn(false); setCameraAttempt(value => value + 1); }}>Try camera again</button></div></div>}
      {torchSupported === false && !review && !preview && <p className={styles.cameraLightUnavailable}>Camera light unavailable on this device or browser.</p>}
      {torchMessage && <p role="status" className={styles.cameraWarning}>{torchMessage} {torchOn && (preview || review) && <button type="button" className={styles.secondary} disabled={torchBusy} onClick={() => toggleTorch(false)}>Turn light off</button>}</p>}
      <div className={styles.cameraView} hidden={review || !!preview}>
        <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview" />
        {torchSupported && <button type="button" className={styles.cameraFlash} onClick={() => toggleTorch(!torchOn)} disabled={torchBusy} aria-pressed={torchOn} aria-label={torchOn ? "Turn camera light off" : "Turn camera light on"} title={torchOn ? "Camera light on" : "Camera light off"}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13.5 2.75 5.75 13h5.7l-.95 8.25L18.25 11h-5.7l.95-8.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{!torchOn && <path d="M4 4 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}</svg><span>Light {torchOn ? "on" : "off"}</span></button>}
      </div>
      {preview && !review && <><div className={styles.cameraView}><PhotoPreview src={preview.url} alt={`Page ${pageNumbers[current]} preview`} /></div>{preview.warning && <p role="status" className={styles.cameraWarning}>{preview.warning}</p>}</>}
      {review && <div className={styles.cameraThumbnails}>{captures.map((item, index) => <div key={pageNumbers[index]}><PhotoPreview src={item.url} alt={`Page ${pageNumbers[index]} preview`} /><strong>Page {pageNumbers[index]}</strong><button type="button" className={styles.secondary} disabled={busy} onClick={() => { setCurrent(index); setReview(false); }}>Retake</button></div>)}</div>}
      <div className={styles.cameraActions}>
        {review ? <button type="button" className={styles.primary} disabled={busy} onClick={upload}>{busy ? "Uploading…" : "Use these photos"}</button> : preview ? <><button type="button" className={styles.secondary} onClick={() => setPreview(null)}>Retake</button><button type="button" className={styles.primary} onClick={usePhoto}>Use photo</button></> : <button type="button" className={styles.primary} disabled={!!error || torchBusy} onClick={capture}>Capture</button>}
      </div>
      <p className={styles.cameraFootnote}>{kind === "answer-key" ? "Photos are checked locally for basic quality. Review your files and select Scan answer key when you are ready to send them to Groq." : "Photos are checked locally for basic quality. Review them yourself; AI reading starts when you select Start checking."}</p>
    </div>
    {confirmClose && <ConfirmDialog title="Leave the camera?" message="Photos taken in this session have not been added yet. Leaving will discard them." confirmLabel="Discard photos" onCancel={() => setConfirmClose(false)} onConfirm={onClose} />}
  </div>;
}
