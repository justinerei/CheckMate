import test from "node:test";
import assert from "node:assert/strict";
import { questionFormRevision } from "../src/lib/question-form-revision.ts";

const initial = { id: "q1", type: "MULTIPLE_CHOICE", text: "", points: "1", choices: [], answers: [], rubric: [], lines: 7, besideNext: false };

test("saved generated question and answer replace the empty editor revision", () => {
  const saved = { ...initial, text: "A question?", choices: [{ label: "A", text: "Yes" }, { label: "B", text: "No" }], answers: ["B"] };
  assert.notEqual(questionFormRevision(initial), questionFormRevision(saved));
  assert.notEqual(questionFormRevision(saved), questionFormRevision({ ...saved, answers: ["A"] }));
});

test("unrelated refresh keeps a question editor revision stable", () => {
  assert.equal(questionFormRevision(initial), questionFormRevision({ ...initial, choices: [], answers: [], rubric: [] }));
});
