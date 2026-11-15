export function applyDraftSectionPoints<T extends { section: number; type: string; points: number | string }>(rows: T[], section: number, points: number): T[] {
  return rows.map(row => row.section === section && row.type !== "ESSAY" ? { ...row, points } : row);
}
