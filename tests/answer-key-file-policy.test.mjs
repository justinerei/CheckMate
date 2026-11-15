import { test } from "node:test";
import assert from "node:assert/strict";
import { isPdfFile, withinAnswerKeyPhotoLimit } from "../src/lib/answer-key-file-policy.ts";

test("allows at most two answer-key photos while PDFs do not count as photos", () => {
  const photo = { name: "key.jpg", type: "image/jpeg" };
  const pdf = { name: "key.pdf", type: "application/pdf" };
  assert.equal(withinAnswerKeyPhotoLimit([photo, photo]), true);
  assert.equal(withinAnswerKeyPhotoLimit([photo, photo, photo]), false);
  assert.equal(withinAnswerKeyPhotoLimit([pdf, photo, photo]), true);
  assert.equal(withinAnswerKeyPhotoLimit([pdf, photo, photo, photo]), false);
});

test("recognizes PDFs by MIME type or filename", () => {
  assert.equal(isPdfFile({ name: "answer.jpg", type: "image/jpeg" }), false);
  assert.equal(isPdfFile({ name: "ANSWER.PDF", type: "" }), true);
  assert.equal(isPdfFile({ name: "document", type: "application/pdf" }), true);
});
