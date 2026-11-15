export function isPdfFile(file: { type: string; name: string }) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export const MAX_ANSWER_KEY_PHOTOS = 2;
export function withinAnswerKeyPhotoLimit(files: { type: string; name: string }[]) {
  return files.filter(file => !isPdfFile(file)).length <= MAX_ANSWER_KEY_PHOTOS;
}
