export function reopenReason(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  return value.trim() || null;
}

export function canFinalizeSavedAnswer(status: string, confirmedText: string | null): boolean {
  return (status === "CONFIRMED" || status === "AUTO_CHECKED") && confirmedText !== null;
}
