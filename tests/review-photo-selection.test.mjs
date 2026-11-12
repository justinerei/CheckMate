import { test } from "node:test";
import assert from "node:assert/strict";
import { selectReviewPages } from "../src/lib/review-photo-selection.ts";

test("review shows the pages containing detected responses without duplicates", () => {
  const pages = [{ pageNumber: 1 }, { pageNumber: 2 }, { pageNumber: 3 }];
  const result = selectReviewPages(pages, [3, 2, 2]);
  assert.deepEqual(result.matched, [pages[1], pages[2]]);
  assert.deepEqual(result.visible, [pages[1], pages[2]]);
});

test("review does not guess a page when none was identified", () => {
  const pages = [{ pageNumber: 1 }, { pageNumber: 2 }];
  assert.deepEqual(selectReviewPages(pages, []).visible, pages);
  assert.deepEqual(selectReviewPages(pages, [5]).visible, pages);
  assert.deepEqual(selectReviewPages(pages, []).matched, []);
});
