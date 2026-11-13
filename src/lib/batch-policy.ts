export const MAX_BATCH_PAPERS = 5;
export const MAX_BATCH_PAGES = 3;

export function canAddPaper(count: number): boolean {
  return Number.isInteger(count) && count >= 0 && count < MAX_BATCH_PAPERS;
}

export function validBatchPageCount(count: number): boolean {
  return Number.isInteger(count) && count >= 1 && count <= MAX_BATCH_PAGES;
}
