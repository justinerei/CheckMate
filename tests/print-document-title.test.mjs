import { test } from "node:test";
import assert from "node:assert/strict";
import { printDocumentTitle } from "../src/lib/print-document-title.ts";

test("uses the quiz name and distinguishes quiz and answer key", () => {
  assert.equal(printDocumentTitle("Science Quiz 1", "quiz"), "Science Quiz 1 - Quiz");
  assert.equal(printDocumentTitle("Science Quiz 1", "answer-key"), "Science Quiz 1 - Answer Key");
});
test("cleans characters that are invalid in common file names", () => {
  assert.equal(printDocumentTitle(' Science: Cells / Tissues? ', "quiz"), "Science Cells Tissues - Quiz");
  assert.equal(printDocumentTitle("  / ", "answer-key"), "Untitled quiz - Answer Key");
});
