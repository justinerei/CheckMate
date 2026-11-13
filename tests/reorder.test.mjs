import { test } from "node:test";
import assert from "node:assert/strict";
import { moveItem, isValidSectionOrder } from "../src/lib/reorder.ts";

test("moving sections keeps the questions and answers with their original section", () => {
  const a = { id: "a", questions: [{ answer: "A" }] }, b = { id: "b", questions: [{ answer: "B" }] }, c = { id: "c", questions: [] };
  const original = [a, b, c];
  assert.deepEqual(moveItem(original, 0, 2), [b, c, a]);
  assert.deepEqual(moveItem(original, 2, 0), [c, a, b]);
  assert.deepEqual(original, [a, b, c]);
  assert.strictEqual(moveItem(original, 1, 1), original);
  assert.strictEqual(moveItem(original, -1, 1), original);
  assert.strictEqual(moveItem(original, 0, 3), original);
});

test("only saves a complete permutation of the current section order", () => {
  const current = ["a", "b", "c"];
  assert.equal(isValidSectionOrder(["c", "a", "b"], current, current), true);
  assert.equal(isValidSectionOrder(["a", "a", "b"], current, current), false);
  assert.equal(isValidSectionOrder(["a", "b", "x"], current, current), false);
  assert.equal(isValidSectionOrder(["a", "b"], current, current), false);
  assert.equal(isValidSectionOrder(["c", "a", "b"], ["b", "a", "c"], current), false);
});
