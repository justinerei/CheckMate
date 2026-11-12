export function hasReadableKeyAnswer(items: { answer?: string | null }[]) {
  return items.some(item => typeof item.answer === "string" && item.answer.trim().length > 0);
}
