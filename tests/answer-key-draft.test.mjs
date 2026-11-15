import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAnswerKeyDraft, parseDraftPoints } from "../src/lib/answer-key-draft.ts";

test("points must be present, positive and precise before saving", () => {
  assert.equal(parseDraftPoints(""), null);
  assert.equal(parseDraftPoints("0"), null);
  assert.equal(parseDraftPoints("0.001"), null);
  assert.equal(parseDraftPoints("10000"), null);
  assert.equal(parseDraftPoints("5"), 5);
  assert.equal(parseDraftPoints("0.5"), 0.5);
});

const blank = { answer: "", type: "MULTIPLE_CHOICE", points: 1, style: "written", section: 1, directions: "" };
test("keeps essay-only and question-only answer key drafts", () => {
  assert.equal(hasAnswerKeyDraft("", [blank]), false);
  assert.equal(hasAnswerKeyDraft("", [{ ...blank, type: "ESSAY" }]), true);
  assert.equal(hasAnswerKeyDraft("", [{ ...blank, questionText: "Why is water important?" }]), true);
  assert.equal(hasAnswerKeyDraft("", [{ ...blank, rubric: [{ title: "Accuracy" }] }]), true);
  assert.equal(hasAnswerKeyDraft("", [blank, blank]), true);
});
