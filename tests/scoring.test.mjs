import test from "node:test";
import assert from "node:assert/strict";
import { adjustedScore, matchesAnswer } from "../src/lib/scoring.ts";

test("objective scoring matches confirmed answers case-insensitively and allows alternatives", () => {
  assert.equal(matchesAnswer("  mars  ", ["Mars", "Red Planet"]), true);
  assert.equal(matchesAnswer("red   planet", ["Mars", "Red Planet"]), true);
  assert.equal(matchesAnswer(" A ", ["a"]), true);
  assert.equal(matchesAnswer("B", ["A"]), false);
  assert.equal(matchesAnswer("", [""]), false);
});

test("a corrected key updates the score in either direction while retaining essay points", () => {
  assert.equal(adjustedScore(4, 0, 1), 5);
  assert.equal(adjustedScore(5, 1, 0), 4);
  assert.equal(adjustedScore(3.75, 0, 0.25), 4);
  assert.equal(adjustedScore(4, 0.25, 0), 3.75);
});
