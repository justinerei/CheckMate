import { test } from "node:test";
import assert from "node:assert/strict";
import { applySectionPoints } from "../src/lib/section-points.ts";

test("updates only non-essay questions in the chosen section", async () => {
  const questions = [
    { sectionId: "one", type: "MULTIPLE_CHOICE", points: 1 },
    { sectionId: "one", type: "IDENTIFICATION", points: 3 },
    { sectionId: "one", type: "ESSAY", points: 10 },
    { sectionId: "two", type: "MULTIPLE_CHOICE", points: 4 },
  ];
  const tx = { question: { updateMany: async ({ where, data }) => {
    for (const q of questions) if (q.sectionId === where.sectionId && q.type !== where.type.not) q.points = data.points;
  } } };
  await applySectionPoints(tx, "one", 2.5);
  assert.deepEqual(questions.map(q => q.points), [2.5, 2.5, 10, 4]);
});

test("counts only objective questions whose points would change", async () => {
  const { countChangedSectionPoints } = await import("../src/lib/section-points.ts");
  const questions = [{ type: "MULTIPLE_CHOICE", points: "1" }, { type: "IDENTIFICATION", points: "2" }, { type: "ESSAY", points: "10" }];
  assert.equal(countChangedSectionPoints(questions, 2), 1);
  assert.equal(countChangedSectionPoints(questions, 3), 2);
});
