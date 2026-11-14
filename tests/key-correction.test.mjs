import test from "node:test";
import assert from "node:assert/strict";
import { parseCorrectedAnswers } from "../src/lib/key-correction.ts";

test("built quiz corrections respect question types and available choices", () => {
  assert.deepEqual(parseCorrectedAnswers(" b ", "BUILT", "MULTIPLE_CHOICE", ["A", "B"]), ["B"]);
  assert.equal(parseCorrectedAnswers("C", "BUILT", "MULTIPLE_CHOICE", ["A", "B"]), null);
  assert.equal(parseCorrectedAnswers("A | B", "BUILT", "MULTIPLE_CHOICE", ["A", "B"]), null);
  assert.deepEqual(parseCorrectedAnswers("f", "BUILT", "TRUE_FALSE", []), ["F"]);
  assert.equal(parseCorrectedAnswers("yes", "BUILT", "TRUE_FALSE", []), null);
  assert.deepEqual(parseCorrectedAnswers("Mars | Red planet", "BUILT", "IDENTIFICATION", []), ["Mars", "Red planet"]);
  assert.equal(parseCorrectedAnswers("x".repeat(201), "BUILT", "IDENTIFICATION", []), null);
});

test("existing quiz alternatives remain supported", () => {
  assert.deepEqual(parseCorrectedAnswers("A | B", "EXISTING", "MULTIPLE_CHOICE", []), ["A", "B"]);
  assert.equal(parseCorrectedAnswers(" | ", "EXISTING", "IDENTIFICATION", []), null);
});
