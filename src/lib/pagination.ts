export type MeasuredBlock = { height: number; keepWithNext?: boolean };
export type Pagination = ReturnType<typeof paginate>;

export function currentPagination<T>(measurement: { blocks: readonly T[]; width: string; height: string; layout: Pagination } | null, blocks: readonly T[], width: string, height: string): Pagination | null {
  return measurement?.blocks === blocks && measurement.width === width && measurement.height === height ? measurement.layout : null;
}

export function paginate(blocks: MeasuredBlock[], capacity: number) {
  const pages: number[][] = [[]];
  const oversized: number[] = [];
  let used = 0;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nextHeight = block.keepWithNext && blocks[i + 1] ? blocks[i + 1].height : 0;
    if (block.height > capacity || block.height + nextHeight > capacity) oversized.push(i);
    if (used > 0 && used + block.height + nextHeight > capacity) { pages.push([]); used = 0; }
    pages[pages.length - 1].push(i);
    used += block.height;
  }
  return { pages, oversized };
}
