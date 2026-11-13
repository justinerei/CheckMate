import { test } from "node:test";
import assert from "node:assert/strict";
import { canAddPaper, validBatchPageCount } from "../src/lib/batch-policy.ts";

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
