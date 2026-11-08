import { createHash } from "node:crypto";

export function quizPrintCode(id: string): string {
  return `CM-${createHash("sha256").update(id).digest("hex").slice(0, 12).toUpperCase()}`;
}
