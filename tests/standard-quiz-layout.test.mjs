import { test } from "node:test";
import assert from "node:assert/strict";
import { questionRows, sectionDirections, validQuestionLayout } from "../src/lib/standard-quiz-layout.ts";

test("standard layout places every question on its own row without changing saved pairings", () => {
  const questions = [{ id: "a", besideNext: true }, { id: "b", besideNext: false }, { id: "c", besideNext: true }];
  assert.deepEqual(questionRows(questions, 10, true).map(row => row.map(item => item.number)), [[11], [12], [13]]);
  assert.deepEqual(questionRows(questions, 10, false).map(row => row.map(item => item.number)), [[11, 12], [13]]);
  assert.equal(questions[0].besideNext, true);
});

test("section presets pair all questions, handle odd counts and leave saved flags untouched", () => {
  const questions = Array.from({ length: 5 }, (_, id) => ({ id, besideNext: false }));
  assert.deepEqual(questionRows(questions, 0, false, "TWO_COLUMN").map(row => row.map(item => item.number)), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(questionRows(questions, 0, false, "SINGLE_COLUMN").map(row => row.map(item => item.number)), [[1], [2], [3], [4], [5]]);
  assert.deepEqual(questionRows(questions, 0, true, "TWO_COLUMN").map(row => row.length), [1, 1, 1, 1, 1]);
  assert.deepEqual(questionRows([...questions, { id: 5, besideNext: false }], 0, false, "TWO_COLUMN").map(row => row.length), [2, 2, 2]);
  assert.equal(questions.every(question => !question.besideNext), true);
  assert.equal(validQuestionLayout("TWO_COLUMN"), true);
  assert.equal(validQuestionLayout("three"), false);
});

test("default directions fill only empty uniform sections in standard layout", () => {
  const templates = { MULTIPLE_CHOICE: "Circle the letter of the correct answer." };
  assert.equal(sectionDirections("", ["MULTIPLE_CHOICE"], templates, true), templates.MULTIPLE_CHOICE);
  assert.equal(sectionDirections("Write the answer.", ["MULTIPLE_CHOICE"], templates, true), "Write the answer.");
  assert.equal(sectionDirections("", ["MULTIPLE_CHOICE", "ESSAY"], templates, true), "");
  assert.equal(sectionDirections("", ["MULTIPLE_CHOICE"], templates, false), "");
});
