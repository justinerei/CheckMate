import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuizOutline, questionIsComplete, sameQuizOutline } from "../src/lib/quiz-outline.ts";

test("validates total and section counts before creating draft slots", () => {
  const rows = [{ type: "MULTIPLE_CHOICE", count: 15 }, { type: "ESSAY", count: 5 }];
  assert.deepEqual(parseQuizOutline(rows, "20"), rows);
  assert.equal(parseQuizOutline(rows, "21"), null);
  assert.equal(parseQuizOutline([{ type: "ESSAY", count: 0 }], "1"), null);
  assert.equal(parseQuizOutline([{ type: "ENUMERATION", count: 1 }], "1"), null);
  assert.equal(parseQuizOutline([{ type: "ESSAY", count: 201 }], "201"), null);
  assert.equal(parseQuizOutline([], "0"), null);
});
test("requires question text and an answer key or rubric", () => {
  const base = { text: "", type: "MULTIPLE_CHOICE", answerKey: null, rubricCriteria: [] };
  assert.equal(questionIsComplete(base), false);
  assert.equal(questionIsComplete({ ...base, text: "Question", answerKey: { acceptedAnswers: ["A"] } }), true);
  assert.equal(questionIsComplete({ ...base, text: "Question" }), false);
  assert.equal(questionIsComplete({ ...base, text: "Question", type: "ESSAY", rubricCriteria: [{ id: "1" }] }), true);
});

test("recognizes an unchanged outline without replacing saved section slots", () => {
  const saved = [{ type: "MULTIPLE_CHOICE", count: 10 }, { type: "TRUE_FALSE", count: 5 }];
  assert.equal(sameQuizOutline(saved, [{ type: "MULTIPLE_CHOICE", count: 10 }, { type: "TRUE_FALSE", count: 5 }]), true);
  assert.equal(sameQuizOutline(saved, [{ type: "TRUE_FALSE", count: 5 }, { type: "MULTIPLE_CHOICE", count: 10 }]), false);
  assert.equal(sameQuizOutline(saved, [{ type: "MULTIPLE_CHOICE", count: 10 }]), false);
  assert.equal(sameQuizOutline(saved, [{ type: "MULTIPLE_CHOICE", count: 10 }, { type: "TRUE_FALSE", count: 4 }]), false);
});
