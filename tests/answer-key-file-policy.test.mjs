import { test } from "node:test";
import assert from "node:assert/strict";
import { isPdfFile, shouldScanDuringPreview } from "../src/lib/answer-key-file-policy.ts";

test("only photos are checked before the teacher proceeds", () => {
  assert.equal(shouldScanDuringPreview({ name: "answer.jpg", type: "image/jpeg" }), true);
  assert.equal(shouldScanDuringPreview({ name: "page.png", type: "image/png" }), true);
  assert.equal(shouldScanDuringPreview({ name: "answer.pdf", type: "application/pdf" }), false);
  assert.equal(shouldScanDuringPreview({ name: "ANSWER.PDF", type: "" }), false);
  assert.equal(isPdfFile({ name: "document", type: "application/pdf" }), true);
});
