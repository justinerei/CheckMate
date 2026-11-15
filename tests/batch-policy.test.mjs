import { test } from "node:test";
import assert from "node:assert/strict";
import { canAddPaper, validBatchPageCount, nextBatchPaperError } from "../src/lib/batch-policy.ts";

test("next student requires a complete current paper and a free batch slot", () => {
  assert.equal(nextBatchPaperError(2, [1, 2], 4, 3), "");
  assert.match(nextBatchPaperError(2, [1], 4, 3), /every page/);
  assert.match(nextBatchPaperError(2, [1, 1], 4, 3), /every page/);
  assert.match(nextBatchPaperError(2, [1, 2], 5, 3), /five/);
  assert.match(nextBatchPaperError(2, [1, 2], 4, 4), /1 to 3/);
});

test("a batch accepts up to five papers including finalized papers", () => {
  assert.equal(canAddPaper(0), true);
  assert.equal(canAddPaper(4), true);
  assert.equal(canAddPaper(5), false);
  assert.equal(canAddPaper(-1), false);
});

test("each batch paper accepts one to three pages", () => {
  for (const count of [1, 2, 3]) assert.equal(validBatchPageCount(count), true);
  for (const count of [0, 4, 1.5, NaN]) assert.equal(validBatchPageCount(count), false);
});
