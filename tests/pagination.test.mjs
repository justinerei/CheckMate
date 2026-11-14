import { test } from "node:test";
import assert from "node:assert/strict";
import { currentPagination, paginate } from "../src/lib/pagination.ts";

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

test("rejects pagination measured for different questions or paper dimensions", () => {
  const blocks = [{ kind: "header" }, { kind: "question" }];
  const layout = paginate([{ height: 50 }, { height: 50 }], 100);
  const measurement = { blocks, width: "210mm", height: "297mm", layout };
  assert.equal(currentPagination(measurement, blocks, "210mm", "297mm"), layout);
  assert.equal(currentPagination(measurement, blocks.slice(0, 1), "210mm", "297mm"), null);
  assert.equal(currentPagination(measurement, [...blocks], "210mm", "297mm"), null);
  assert.equal(currentPagination(measurement, blocks, "8.5in", "11in"), null);
  assert.equal(currentPagination(null, blocks, "210mm", "297mm"), null);
});
