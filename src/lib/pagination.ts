export type MeasuredBlock = { height: number; keepWithNext?: boolean; flow?: string };
export type Pagination = ReturnType<typeof paginate>;

export function currentPagination<T>(measurement: { blocks: readonly T[]; width: string; height: string; layout: Pagination } | null, blocks: readonly T[], width: string, height: string): Pagination | null {
  return measurement?.blocks === blocks && measurement.width === width && measurement.height === height ? measurement.layout : null;
}

export function paginate(blocks: MeasuredBlock[], capacity: number) {
  const pages: number[][] = [[]];
  const oversized: number[] = [];
  let used = 0;
  let flow: string | undefined;
  let flowBase = 0;
  let columns = [0, 0];
  let flowCount = 0;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nextHeight = block.keepWithNext && blocks[i + 1] ? blocks[i + 1].height : 0;
    if (block.height > capacity || block.height + nextHeight > capacity) oversized.push(i);
    if (block.flow !== flow || !block.flow) { flow = block.flow; flowBase = used; columns = [0, 0]; flowCount = 0; }
    let projected = block.flow ? flowBase + Math.max(columns[flowCount % 2] + block.height, columns[1 - flowCount % 2]) : used + block.height + nextHeight;
    if (used > 0 && projected > capacity) { pages.push([]); used = 0; flowBase = 0; columns = [0, 0]; flowCount = 0; projected = block.height; }
    pages[pages.length - 1].push(i);
    if (block.flow) { columns[flowCount % 2] += block.height; flowCount++; used = projected; }
    else used += block.height;
  }
  return { pages, oversized };
}
