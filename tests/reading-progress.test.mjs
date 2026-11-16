import { test } from "node:test";
import assert from "node:assert/strict";
import { readingProgress } from "../src/lib/reading-progress.ts";

const page = (status, retryAt = null) => ({ status, retryAt });
const paper = (status, expectedPages, pages) => ({ status, expectedPages, pages });

test("reports actual read pages and the current reading state", () => {
  assert.deepEqual(readingProgress([paper("IN_REVIEW", 3, [page("COMPLETE"), page("PROCESSING"), page("PENDING")])]), { completed: 1, total: 3, state: "Reading page" });
  assert.deepEqual(readingProgress([paper("IN_REVIEW", 3, [page("COMPLETE"), page("FAILED", "2030-01-01"), page("PENDING")])]), { completed: 1, total: 3, state: "Waiting to retry" });
  assert.equal(readingProgress([paper("IN_REVIEW", 1, [page("FAILED")])]).state, "Needs attention");
  assert.equal(readingProgress([paper("IN_REVIEW", 1, [page("PENDING")])]).state, "Queued for checking");
  assert.equal(readingProgress([paper("IN_REVIEW", 1, [page("COMPLETE")])]).state, "Pages read");
});

test("batch totals exclude unstarted drafts and allow older papers without a page count", () => {
  const papers = [paper("FINALIZED", 2, [page("COMPLETE"), page("COMPLETE")]), paper("IN_REVIEW", null, [page("COMPLETE"), page("PENDING")]), paper("DRAFT", 3, [page("PENDING")])];
  assert.deepEqual(readingProgress(papers), { completed: 3, total: 4, state: "Queued for checking" });
  assert.equal(readingProgress([paper("DRAFT", 3, [])]).total, 0);
});
