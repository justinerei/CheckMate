import { test } from "node:test";
import assert from "node:assert/strict";
import { questionRows, sectionDirections } from "../src/lib/standard-quiz-layout.ts";

test("standard layout places every question on its own row without changing saved pairings", () => {
  const questions = [{ id: "a", besideNext: true }, { id: "b", besideNext: false }, { id: "c", besideNext: true }];
  assert.deepEqual(questionRows(questions, 10, true).map(row => row.map(item => item.number)), [[11], [12], [13]]);
  assert.deepEqual(questionRows(questions, 10, false).map(row => row.map(item => item.number)), [[11, 12], [13]]);
  assert.equal(questions[0].besideNext, true);
});

test("default directions fill only empty uniform sections in standard layout", () => {
  const templates = { MULTIPLE_CHOICE: "Circle the letter of the correct answer." };
  assert.equal(sectionDirections("", ["MULTIPLE_CHOICE"], templates, true), templates.MULTIPLE_CHOICE);
  assert.equal(sectionDirections("Write the answer.", ["MULTIPLE_CHOICE"], templates, true), "Write the answer.");
  assert.equal(sectionDirections("", ["MULTIPLE_CHOICE", "ESSAY"], templates, true), "");
  assert.equal(sectionDirections("", ["MULTIPLE_CHOICE"], templates, false), "");
});
