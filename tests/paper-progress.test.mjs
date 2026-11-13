import { test } from "node:test";
import assert from "node:assert/strict";
import { paperProgress } from "../src/lib/paper-progress.ts";

test("uses consistent states for paper processing and failures", () => {
  const status = (state, pages, count = 1) => paperProgress(state, count, pages);
  assert.equal(status("DRAFT", []).label, "Photos needed");
  assert.equal(status("IN_REVIEW", [{ status: "PENDING", retryAt: null }]).label, "Waiting to be checked");
  assert.equal(status("IN_REVIEW", [{ status: "PROCESSING", retryAt: null }]).label, "Checking");
  assert.equal(status("IN_REVIEW", [{ status: "FAILED", retryAt: new Date() }]).label, "Waiting to continue");
  assert.equal(status("IN_REVIEW", [{ status: "FAILED", retryAt: null }]).label, "Page needs attention");
  assert.equal(status("IN_REVIEW", [{ status: "COMPLETE", retryAt: null }]).label, "Ready for review");
  assert.equal(status("FINALIZED", []).label, "Finalized");
});
