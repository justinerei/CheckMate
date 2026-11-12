import { test } from "node:test";
import assert from "node:assert/strict";
import { groupDetectedKeyRows } from "../src/lib/existing-key-sections.ts";

test("groups consecutive detected question types and answer styles without discarding styles", () => {
  const rows = [
    { number: 3, type: "IDENTIFICATION", style: "text" },
    { number: 1, type: "MULTIPLE_CHOICE", style: "circle" },
    { number: 2, type: "TRUE_FALSE", style: "written" },
    { number: 4, type: "IDENTIFICATION", style: "text" },
  ];
  assert.deepEqual(groupDetectedKeyRows(rows).map(r => [r.number, r.section, r.style]), [[1, 1, "circle"], [2, 2, "written"], [3, 3, "text"], [4, 3, "text"]]);
});

test("separates same-type questions with different detected styles", () => {
  const rows = [{ number: 1, type: "MULTIPLE_CHOICE", style: "circle" }, { number: 2, type: "MULTIPLE_CHOICE", style: "written" }];
  assert.deepEqual(groupDetectedKeyRows(rows).map(r => r.section), [1, 2]);
});
