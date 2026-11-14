import test from "node:test";
import assert from "node:assert/strict";
import { reopenReason, canFinalizeSavedAnswer } from "../src/lib/result-revision.ts";

test("a reopened result requires a short, non-empty reason", () => {
  assert.equal(reopenReason("  Wrong transcription  "), "Wrong transcription");
  assert.equal(reopenReason("  "), null);
  assert.equal(reopenReason("x".repeat(501)), null);
  assert.equal(reopenReason(null), null);
});

test("refinalization preserves saved automatic and teacher-confirmed answers", () => {
  assert.equal(canFinalizeSavedAnswer("AUTO_CHECKED", "B"), true);
  assert.equal(canFinalizeSavedAnswer("CONFIRMED", ""), true);
  assert.equal(canFinalizeSavedAnswer("PENDING", "B"), false);
  assert.equal(canFinalizeSavedAnswer("AUTO_CHECKED", null), false);
});
