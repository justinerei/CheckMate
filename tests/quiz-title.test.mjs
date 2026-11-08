import { test } from "node:test";
import assert from "node:assert/strict";
import { validQuizTitle } from "../src/lib/quiz-title.ts";

test("trims quiz titles and rejects blank or oversized input", () => {
  assert.equal(validQuizTitle("  Biology quiz  "), "Biology quiz");
  assert.equal(validQuizTitle("   "), null);
  assert.equal(validQuizTitle("x".repeat(121)), null);
  assert.equal(validQuizTitle(null), null);
});
