// Imported keys do not provide reliable section boundaries. Keep adjacent
// questions together only when both detected type and style agree.
export function groupDetectedKeyRows<T extends { number: number; type: string; style: string }>(rows: T[]): (T & { section: number })[] {
  const sorted = [...rows].sort((a, b) => a.number - b.number);
  let section = 0;
  return sorted.map((row, index) => {
    const previous = sorted[index - 1];
    if (!previous || previous.type !== row.type || previous.style !== row.style) section++;
    return { ...row, section };
  });
}
