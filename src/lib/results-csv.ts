type ResultRow = { name: string; score: string; maximum: string; finalizedAt: Date | null };

function csvCell(value: string, protectFormula = false): string {
  const safe = protectFormula && /^[\s\u0000-\u001f]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function resultsCsv(rows: ResultRow[]): string {
  const lines = ["Student name,Score,Maximum score,Finalized at (UTC)"];
  for (const row of rows) lines.push([csvCell(row.name, true), csvCell(row.score), csvCell(row.maximum), row.finalizedAt?.toISOString() ?? ""].join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
