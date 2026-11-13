import { test } from "node:test";
import assert from "node:assert/strict";
import { builtAnswerStyle, normalizeBuiltReading } from "../src/lib/built-review.ts";

test("built quizzes use printed answer styles by question type", () => {
  assert.equal(builtAnswerStyle("MULTIPLE_CHOICE"), "circle");
  assert.equal(builtAnswerStyle("TRUE_FALSE"), "written");
  assert.equal(builtAnswerStyle("ESSAY"), "written");
});

test("built readings preserve section and translate detected mark shape", () => {
  const result = normalizeBuiltReading({ number: 1, section: 2, status: "clear", answer: "A", note: "", markShape: "circle" }, "MULTIPLE_CHOICE");
  assert.equal(result.section, 2);
  assert.equal(result.observedStyle, "circle");
  assert.equal(normalizeBuiltReading({ number: 1, section: null, status: "clear", answer: "T", note: "" }, "TRUE_FALSE").observedStyle, "unknown");
});
