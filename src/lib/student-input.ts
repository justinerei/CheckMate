export function studentName(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length > 0 && name.length <= 120 && !/[\u0000-\u001f\u007f]/.test(name) ? name : null;
}

export function normalizeStudentCode(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^CM-(?:[0-9A-F]{8}-){3}[0-9A-F]{8}$/.test(code) ? code : null;
}
