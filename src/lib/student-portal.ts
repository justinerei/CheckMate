import { createHash, randomBytes } from "node:crypto";

export function newStudentInviteCode() { return randomBytes(32).toString("base64url"); }
export function validStudentInviteCode(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value.trim()); }
export function studentInviteHash(value: string) { return createHash("sha256").update(value.trim()).digest("hex"); }

export function releasedStudentResults(accountId: string) {
  return { student: { accountId }, status: "FINALIZED" as const, releasedAt: { not: null }, totalScore: { not: null } };
}
