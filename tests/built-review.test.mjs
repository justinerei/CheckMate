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


test("clear written true-false readings can be scored while missing or uncertain styles stay flagged", async () => {
  const { automaticDecision } = await import("../src/lib/auto-review.ts");
  const { objectivePoints } = await import("../src/lib/scoring.ts");
  const reading = { number: 2, section: 1, status: "clear", answer: "T", note: "", observedStyle: "written", erasure: "none" };
  const candidate = normalizeBuiltReading(reading, "TRUE_FALSE");
  const decision = automaticDecision([candidate], builtAnswerStyle("TRUE_FALSE"), "TRUE_FALSE", ["T"]);
  assert.equal(decision, "FOLLOWED");
  assert.equal(objectivePoints(candidate.answer, ["T"], 1, decision), 1);
  assert.equal(automaticDecision([{ ...candidate, observedStyle: "unknown" }], "written", "TRUE_FALSE", ["T"]), null);
  assert.equal(automaticDecision([{ ...candidate, status: "unclear" }], "written", "TRUE_FALSE", ["T"]), null);
});
