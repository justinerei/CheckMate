// Group adjacent extracted questions so one section has one answer style.
// A type change starts another editable section, as do explicit new directions.
export function groupExtractedKeyRows<T extends { number: number; section: number; style: string; type: string; directions: string; sectionTitle?: string }>(rows: T[]): (T & { sectionTitle: string })[] {
  const sorted = [...rows].sort((a, b) => a.number - b.number);
  let section = 0;
  let style = "";
  let type = "";
  let directions = "";
  let heading = "";
  const grouped = sorted.map(row => {
    const nextDirections = row.directions.trim();
    const nextHeading = row.sectionTitle?.trim() ?? "";
    if (!section || row.style !== style || row.type !== type || (nextDirections && directions && nextDirections !== directions) || (nextHeading && heading && nextHeading !== heading)) {
      section++;
      style = row.style;
      type = row.type;
      directions = nextDirections;
      heading = nextHeading;
    } else if (!directions && nextDirections) {
      directions = nextDirections;
    }
    if (!heading && nextHeading) heading = nextHeading;
    return { ...row, section };
  });
  const sectionDirections = new Map<number, string>();
  const sectionTitles = new Map<number, string>();
  for (const row of grouped) if (row.directions.trim()) sectionDirections.set(row.section, row.directions.trim());
  for (const row of grouped) if (row.sectionTitle?.trim()) sectionTitles.set(row.section, row.sectionTitle.trim());
  const defaults: Record<string, string> = { MULTIPLE_CHOICE: "Multiple Choice", TRUE_FALSE: "True or False", IDENTIFICATION: "Identification", ESSAY: "Essay" };
  return grouped.map(row => ({ ...row, directions: sectionDirections.get(row.section) ?? "", sectionTitle: sectionTitles.get(row.section) ?? defaults[row.type] ?? `Section ${row.section}` }));
}
