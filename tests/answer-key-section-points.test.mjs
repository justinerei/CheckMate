import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDraftSectionPoints, sectionPointsValue } from "../src/lib/answer-key-section-points.ts";

test("section points show a shared value and distinguish mixed values", () => {
  assert.equal(sectionPointsValue([{ type: "MULTIPLE_CHOICE", points: 1 }, { type: "TRUE_FALSE", points: "1" }]), "1");
  assert.equal(sectionPointsValue([{ type: "MULTIPLE_CHOICE", points: 1 }, { type: "TRUE_FALSE", points: 2 }]), null);
  assert.equal(sectionPointsValue([{ type: "MULTIPLE_CHOICE", points: "" }]), "");
  assert.equal(sectionPointsValue([{ type: "MULTIPLE_CHOICE", points: "0.5" }, { type: "ESSAY", points: 10 }]), "0.5");
});

test("updates objective questions in the selected section without changing essays or other sections", () => {
  const rows = [
    { section: 1, type: "MULTIPLE_CHOICE", points: 1 },
    { section: 1, type: "IDENTIFICATION", points: "3" },
    { section: 1, type: "ESSAY", points: 10, rubricConfirmed: true },
    { section: 2, type: "TRUE_FALSE", points: 4 },
  ];
  const result = applyDraftSectionPoints(rows, 1, 2.5);
  assert.deepEqual(result.map(row => row.points), [2.5, 2.5, 10, 4]);
  assert.equal(result[2].rubricConfirmed, true);
  assert.equal(rows[0].points, 1);
  const cleared = applyDraftSectionPoints(rows, 1, "");
  assert.deepEqual(cleared.map(row => row.points), ["", "", 10, 4]);
});
