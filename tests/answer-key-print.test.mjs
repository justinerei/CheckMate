import { test } from "node:test";
import assert from "node:assert/strict";
import { answerKeyPrintSections } from "../src/lib/answer-key-print.ts";

const question = (overrides = {}) => ({ id: "q1", type: "MULTIPLE_CHOICE", text: "Choose one.", points: 2, answerKey: { acceptedAnswers: ["B"] }, choices: [{ label: "A", text: "First" }, { label: "B", text: "Second" }], rubricCriteria: [], ...overrides });

test("answer-key print respects quiz numbering and includes choice text and alternative answers", () => {
  const sections = [
    { id: "s1", title: "Multiple choice", questions: [question()] },
    { id: "s2", title: "Identification", questions: [question({ id: "q2", type: "IDENTIFICATION", answerKey: { acceptedAnswers: ["color", "colour"] }, choices: [] })] },
  ];
  const continuous = answerKeyPrintSections(sections, "CONTINUOUS");
  assert.equal(continuous[0].questions[0].number, 1);
  assert.deepEqual(continuous[0].questions[0].answers, ["B — Second"]);
  assert.equal(continuous[1].questions[0].number, 2);
  assert.deepEqual(continuous[1].questions[0].answers, ["color", "colour"]);
  assert.equal(answerKeyPrintSections(sections, "RESET_PER_SECTION")[1].questions[0].number, 1);
});

test("answer-key print preserves essay rubrics and makes missing answers identifiable", () => {
  const sections = [{ id: "s", title: "Essay", questions: [
    question({ id: "essay", type: "ESSAY", answerKey: null, choices: [], rubricCriteria: [{ title: "Clarity", description: "Explain the idea.", maxPoints: 3 }] }),
    question({ id: "missing", answerKey: null }),
  ] }];
  const result = answerKeyPrintSections(sections, "CONTINUOUS")[0].questions;
  assert.deepEqual(result[0].rubric, [{ title: "Clarity", description: "Explain the idea.", points: "3" }]);
  assert.deepEqual(result[1].answers, []);
});
