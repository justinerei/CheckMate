import { test } from "node:test";
import assert from "node:assert/strict";
import { requiresUnmatchedReview } from "../src/lib/review-safety.ts";

test("unmatched readings block finalization until every question is explicitly confirmed", () => {
  const questions = [{ id: "q1" }, { id: "q2" }];
  const confirmed = [{ questionId: "q1", reviewStatus: "CONFIRMED", confirmedText: "B" }];
  assert.equal(requiresUnmatchedReview(1, questions, confirmed), true);
  assert.equal(requiresUnmatchedReview(0, questions, []), false);
  assert.equal(requiresUnmatchedReview(1, questions, [...confirmed, { questionId: "q2", reviewStatus: "AUTO_CHECKED", confirmedText: "A" }]), true);
  assert.equal(requiresUnmatchedReview(1, questions, [...confirmed, { questionId: "q2", reviewStatus: "CONFIRMED", confirmedText: "" }]), false);
});
