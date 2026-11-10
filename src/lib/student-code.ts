import { randomBytes } from "node:crypto";

export function createStudentCode(): string {
  const digits = randomBytes(16).toString("hex").toUpperCase();
  return `CM-${digits.match(/.{8}/g)!.join("-")}`;
}
