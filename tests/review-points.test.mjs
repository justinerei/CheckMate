import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewPoints } from "../src/lib/review-points.ts";
import { objectivePoints } from "../src/lib/scoring.ts";

const saved = { reviewStatus: "CONFIRMED", instructionDecision: "FOLLOWED", confirmedText: "B", objectiveScore: 2, teacherScore: null };
const score = (answer, type = "MULTIPLE_CHOICE", automatic = null, suggestion = "B", finalized = false) => reviewPoints(answer, finalized, type, ["B"], 2, automatic, suggestion, objectivePoints);
test("scores confirmed and automatic answers using the same review rules", () => {
  assert.equal(score(saved), 2);
  assert.equal(score(null, "MULTIPLE_CHOICE", "FOLLOWED"), 2);
  assert.equal(score(null, "MULTIPLE_CHOICE", "VIOLATION"), 0);
  assert.equal(score({ ...saved, instructionDecision: "VIOLATION" }), 0);
  assert.equal(score({ ...saved, objectiveScore: 0 }, "MULTIPLE_CHOICE", null, "B", true), 0);
});
test("keeps uncertain answers and unscored essays pending", () => {
  assert.equal(score(null), null);
  assert.equal(score({ ...saved, reviewStatus: "PENDING" }), null);
  assert.equal(score({ ...saved, teacherScore: null }, "ESSAY"), null);
  assert.equal(score({ ...saved, teacherScore: 1.5 }, "ESSAY"), 1.5);
});
