import { test } from "node:test";
import assert from "node:assert/strict";
import { hasReadableKeyAnswer } from "../src/lib/answer-key-reading.ts";

test("does not treat an empty or unreadable extraction as an answer key", () => {
  assert.equal(hasReadableKeyAnswer([]), false);
  assert.equal(hasReadableKeyAnswer([{ answer: "" }, { answer: "  " }, { answer: null }]), false);
  assert.equal(hasReadableKeyAnswer([{ answer: "" }, { answer: "B" }]), true);
});
