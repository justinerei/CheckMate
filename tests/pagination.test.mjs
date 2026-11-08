import { test } from "node:test";
import assert from "node:assert/strict";
import { paginate } from "../src/lib/pagination.ts";

test("keeps section headings with their first question", () => {
  const result = paginate([{height:50}, {height:30, keepWithNext:true}, {height:30}, {height:40}], 100);
  assert.deepEqual(result.pages, [[0], [1, 2, 3]]);
  assert.deepEqual(result.oversized, []);
});

test("reports content taller than an entire page", () => {
  const result = paginate([{height:120}], 100);
  assert.deepEqual(result.pages, [[0]]);
  assert.deepEqual(result.oversized, [0]);
});
