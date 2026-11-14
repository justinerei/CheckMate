import { test } from "node:test";
import assert from "node:assert/strict";
import { groupSectionRubrics } from "../src/lib/print-rubrics.ts";

test("groups matching essay criteria and labels distinct criteria with their questions", () => {
  const rubric = [{ id: "a", title: "Accuracy", description: "Correct facts", points: "2" }];
  const questions = [
    { type: "ESSAY", rubric },
    { type: "ESSAY", rubric: [{ ...rubric[0], id: "b" }] },
    { type: "TRUE_FALSE", rubric: [] },
    { type: "ESSAY", rubric: [{ ...rubric[0], id: "c", points: "3" }] },
  ];
  const groups = groupSectionRubrics(questions, 20);
  assert.deepEqual(groups.map(group => group.numbers), [[21, 22], [24]]);
  assert.equal(groups[1].rubric[0].points, "3");
  assert.deepEqual(groupSectionRubrics(questions, 0).map(group => group.numbers), [[1, 2], [4]]);
});
