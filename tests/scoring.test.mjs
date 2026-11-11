import test from "node:test";
import assert from "node:assert/strict";
import { matchesAnswer } from "../src/lib/scoring.ts";

test("objective scoring matches confirmed answers case-insensitively and allows alternatives", () => {
  assert.equal(matchesAnswer("  mars  ", ["Mars", "Red Planet"]), true);
  assert.equal(matchesAnswer("red   planet", ["Mars", "Red Planet"]), true);
  assert.equal(matchesAnswer(" A ", ["a"]), true);
  assert.equal(matchesAnswer("B", ["A"]), false);
  assert.equal(matchesAnswer("", [""]), false);
});
