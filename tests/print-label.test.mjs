import { test } from "node:test";
import assert from "node:assert/strict";
import { quizPrintCode } from "../src/lib/print-label.ts";

test("print codes are stable, compact, and differ between quizzes", () => {
  assert.match(quizPrintCode("quiz-one"), /^CM-[A-F0-9]{12}$/);
  assert.equal(quizPrintCode("quiz-one"), quizPrintCode("quiz-one"));
  assert.notEqual(quizPrintCode("quiz-one"), quizPrintCode("quiz-two"));
});
