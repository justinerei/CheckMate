export type MeasuredBlock = { height: number; keepWithNext?: boolean };

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
