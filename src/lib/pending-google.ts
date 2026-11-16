type PendingGoogle = { googleId: string; email: string; name: string; expiresAt: number };
export function validPendingGoogle(value: unknown, now = Date.now()): value is PendingGoogle {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PendingGoogle>;
  return typeof item.googleId === "string" && item.googleId.length > 0 && typeof item.email === "string" && item.email.length > 0 && typeof item.name === "string" && item.name.length > 0 && typeof item.expiresAt === "number" && Number.isFinite(item.expiresAt) && item.expiresAt > now;
}
