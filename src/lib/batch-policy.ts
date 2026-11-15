export const MAX_BATCH_PAPERS = 5;
export const MAX_BATCH_PAGES = 3;

export function canAddPaper(count: number): boolean {
  return Number.isInteger(count) && count >= 0 && count < MAX_BATCH_PAPERS;
}

export function validBatchPageCount(count: number): boolean {
  return Number.isInteger(count) && count >= 1 && count <= MAX_BATCH_PAGES;
}

export function nextBatchPaperError(expectedPages: number, pageNumbers: number[], batchCount: number, nextPages: number): string {
  if (!validBatchPageCount(nextPages)) return "Choose 1 to 3 pages for the next paper.";
  if (!validBatchPageCount(expectedPages) || pageNumbers.length !== expectedPages || new Set(pageNumbers).size !== expectedPages || pageNumbers.some(number => !Number.isInteger(number) || number < 1 || number > expectedPages)) return "Upload every page in the correct order before confirming.";
  if (!canAddPaper(batchCount)) return "This batch already has five papers.";
  return "";
}
