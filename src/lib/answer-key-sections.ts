// Group adjacent extracted questions so one section has one answer style.
// A type change starts another editable section, as do explicit new directions.
export function groupExtractedKeyRows<T extends { number: number; section: number; style: string; type: string; directions: string }>(rows: T[]): T[] {
  const sorted = [...rows].sort((a, b) => a.number - b.number);
  let section = 0;
  let style = "";
  let type = "";
  let directions = "";
  const grouped = sorted.map(row => {
    const nextDirections = row.directions.trim();
    if (!section || row.style !== style || row.type !== type || (nextDirections && directions && nextDirections !== directions)) {
      section++;
      style = row.style;
      type = row.type;
      directions = nextDirections;
    } else if (!directions && nextDirections) {
      directions = nextDirections;
    }
    return { ...row, section };
  });
  const sectionDirections = new Map<number, string>();
  for (const row of grouped) if (row.directions.trim()) sectionDirections.set(row.section, row.directions.trim());
  return grouped.map(row => ({ ...row, directions: sectionDirections.get(row.section) ?? "" }));
}
