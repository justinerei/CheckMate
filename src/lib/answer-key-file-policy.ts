export function isPdfFile(file: { type: string; name: string }) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
export function shouldScanDuringPreview(file: { type: string; name: string }) {
  return !isPdfFile(file);
}
