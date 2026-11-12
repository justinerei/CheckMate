import { test } from "node:test";
import assert from "node:assert/strict";
import { groupExtractedKeyRows } from "../src/lib/answer-key-sections.ts";

const row = (number, style, directions = "") => ({ number, section: 1, style, directions, type: "MULTIPLE_CHOICE" });

test("groups a mixed answer key into consecutive sections without changing answers", () => {
  const rows = [row(4, "text"), row(2, "written"), row(1, "written"), row(3, "text"), row(5, "written")];
  assert.deepEqual(groupExtractedKeyRows(rows).map(r => [r.number, r.section]), [[1, 1], [2, 1], [3, 2], [4, 2], [5, 3]]);
  assert.deepEqual(rows.map(r => r.number), [4, 2, 1, 3, 5]);
});

test("separates differing explicit directions while allowing missing directions", () => {
  const rows = [row(1, "written", "Write the letter"), row(2, "written"), row(3, "written", "Write true or false")];
  assert.deepEqual(groupExtractedKeyRows(rows).map(r => r.section), [1, 1, 2]);
});


test("different question types get separate sections even with the same style", () => {
  const rows = [row(1, "written"), { ...row(2, "written"), type: "TRUE_FALSE" }];
  assert.deepEqual(groupExtractedKeyRows(rows).map(r => r.section), [1, 2]);
});

test("directions found later apply to the entire section", () => {
  const rows = [row(1, "written"), row(2, "written", "Write the letter")];
  assert.deepEqual(groupExtractedKeyRows(rows).map(r => r.directions), ["Write the letter", "Write the letter"]);
});
