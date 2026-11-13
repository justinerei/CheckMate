import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAnswerKeyDraft } from "../src/lib/answer-key-draft.ts";

const blank = { answer: "", type: "MULTIPLE_CHOICE", points: 1, style: "written", section: 1, directions: "" };
test("keeps essay-only and question-only answer key drafts", () => {
  assert.equal(hasAnswerKeyDraft("", [blank]), false);
  assert.equal(hasAnswerKeyDraft("", [{ ...blank, type: "ESSAY" }]), true);
  assert.equal(hasAnswerKeyDraft("", [{ ...blank, questionText: "Why is water important?" }]), true);
  assert.equal(hasAnswerKeyDraft("", [{ ...blank, rubric: [{ title: "Accuracy" }] }]), true);
  assert.equal(hasAnswerKeyDraft("", [blank, blank]), true);
});
