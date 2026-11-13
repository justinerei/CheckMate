import { test } from "node:test";
import assert from "node:assert/strict";
import { isPdfFile } from "../src/lib/answer-key-file-policy.ts";

test("recognizes PDFs by MIME type or filename", () => {
  assert.equal(isPdfFile({ name: "answer.jpg", type: "image/jpeg" }), false);
  assert.equal(isPdfFile({ name: "ANSWER.PDF", type: "" }), true);
  assert.equal(isPdfFile({ name: "document", type: "application/pdf" }), true);
});
