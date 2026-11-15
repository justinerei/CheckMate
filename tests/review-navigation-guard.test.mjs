import { test } from "node:test";
import assert from "node:assert/strict";
import { needsReviewConfirmation } from "../src/lib/review-navigation-guard.ts";

test("only asks when leaving a question with unsaved edits", () => {
  assert.equal(needsReviewConfirmation(true, "question-1", "question-2"), true);
  assert.equal(needsReviewConfirmation(false, "question-1", "question-2"), false);
  assert.equal(needsReviewConfirmation(true, "question-1", "question-1"), false);
});
