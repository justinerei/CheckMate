import { test } from "node:test";
import assert from "node:assert/strict";
import { paperProgress } from "../src/lib/paper-progress.ts";

test("uses consistent states for paper processing and failures", () => {
  const status = (state, pages, count = 1) => paperProgress(state, count, pages);
  assert.equal(status("DRAFT", []).label, "Photos needed");
  assert.equal(status("IN_REVIEW", [{ status: "PENDING", retryAt: null }]).label, "Waiting to be checked");
  assert.equal(status("IN_REVIEW", [{ status: "PROCESSING", retryAt: null }]).label, "Checking");
  assert.equal(status("IN_REVIEW", [{ status: "FAILED", retryAt: new Date() }]).label, "Waiting for AI retry");
  assert.equal(status("IN_REVIEW", [{ status: "FAILED", retryAt: null }]).label, "Page needs attention");
  assert.equal(status("IN_REVIEW", [{ status: "COMPLETE", retryAt: null }]).label, "Ready for review");
  assert.equal(status("FINALIZED", []).label, "Finalized");
});


test("distinguishes answers needing review, student name confirmation, and finalization", () => {
  const pages = [{ status: "COMPLETE", retryAt: null }];
  assert.equal(paperProgress("IN_REVIEW", 1, pages, { flagged: 2, unmatchedBlocked: false, nameReviewed: true }).label, "Needs review");
  assert.equal(paperProgress("IN_REVIEW", 1, pages, { flagged: 0, unmatchedBlocked: true, nameReviewed: true }).label, "Needs review");
  assert.equal(paperProgress("IN_REVIEW", 1, pages, { flagged: 0, unmatchedBlocked: false, nameReviewed: false }).label, "Confirm student name");
  assert.equal(paperProgress("IN_REVIEW", 1, pages, { flagged: 0, unmatchedBlocked: false, nameReviewed: true }).label, "Ready to finalize");
  assert.equal(paperProgress("IN_REVIEW", 1, pages, { flagged: 0, unmatchedBlocked: false, finalizationBlocked: true, nameReviewed: true }).label, "Needs review");
  assert.equal(paperProgress("FINALIZED", 1, pages, { flagged: 0, unmatchedBlocked: false, nameReviewed: true }).label, "Finalized");
  assert.equal(paperProgress("IN_REVIEW", 1, [{ status: "FAILED", retryAt: null }], { flagged: 0, unmatchedBlocked: false, nameReviewed: true }).label, "Ready to finalize");
});

test("batch status distinguishes a rate limit, a due retry, and active reading", async () => {
  const { batchCheckingStatus } = await import("../src/lib/paper-progress.ts");
  const now = Date.parse("2026-11-15T06:00:00Z");
  const waiting = [{ status: "FAILED", retryAt: "2026-11-15T06:17:00Z" }, { status: "PENDING", retryAt: null }];
  assert.deepEqual(batchCheckingStatus(waiting, now), { kind: "rate_limit", retryAt: "2026-11-15T06:17:00.000Z" });
  assert.deepEqual(batchCheckingStatus(waiting, now + 18 * 60000), { kind: "queued" });
  assert.deepEqual(batchCheckingStatus([...waiting, { status: "PROCESSING", retryAt: null }], now), { kind: "reading" });
  assert.deepEqual(batchCheckingStatus([{ status: "FAILED", retryAt: null }], now), { kind: "attention" });
});
