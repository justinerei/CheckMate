import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExtraction, matchCandidates, retryDelayMs, needsReview } from "../src/lib/extraction.ts";

test("validates extraction structure and rejects malformed or fabricated statuses", () => {
  const parsed = parseExtraction(JSON.stringify({ items: [{ number: 1, section: null, answer: "B", status: "clear", note: "" }] }));
  assert.equal(parsed?.items[0].answer, "B");
  assert.equal(parseExtraction('{"items":[{"number":1,"section":null,"answer":"B","status":"perfect","note":""}]}'), null);
  assert.equal(parseExtraction('{"items":[{"number":1,"section":null,"answer":null,"status":"multiple","note":""}]}')?.items[0].status, "multiple");
  assert.equal(parseExtraction("not json"), null);
});

test("matches only unambiguous question numbers and flags duplicate suggestions", () => {
  const questions = [{ id: "a", number: 1, section: 1 }, { id: "b", number: 1, section: 2 }];
  const items = [{ number: 1, section: null, answer: "B", status: "clear", note: "" }];
  assert.equal(matchCandidates(questions, items).unmatched.length, 1);
  const withSection = [{ ...items[0], section: 1 }];
  assert.equal(matchCandidates(questions, withSection).byQuestion.a.length, 1);
  assert.equal(matchCandidates(questions, [...withSection, ...withSection]).byQuestion.a.length, 2);
});

test("honors retry-after seconds and HTTP dates", () => {
  assert.equal(retryDelayMs("12", 0), 12000);
  assert.equal(retryDelayMs("Thu, 01 Jan 1970 00:01:00 GMT", 0), 60000);
  assert.equal(retryDelayMs(null, 0), 60000);
});

test("flags uncertain, missing, or conflicting answers but not clear or confirmed answers", () => {
  const item = { number: 1, section: 1, answer: "B", status: "clear", note: "" };
  assert.equal(needsReview([item], false), false);
  assert.equal(needsReview([{ ...item, status: "blank", answer: null }], false), false);
  assert.equal(needsReview([{ ...item, status: "unclear" }], false), true);
  assert.equal(needsReview([item, item], false), true);
  assert.equal(needsReview([], false), true);
  assert.equal(needsReview([{ ...item, status: "unclear" }], true), false);
});

test("requires a readable shape for multiple choice and rejects unsupported shapes", () => {
  const item = { number: 1, section: 1, answer: "B", status: "clear", note: "", markShape: "circle" };
  assert.equal(needsReview([item], false, true), false);
  assert.equal(needsReview([{ ...item, markShape: "unknown" }], false, true), true);
  assert.equal(needsReview([{ ...item, markShape: "box" }], false, true), false);
  assert.equal(parseExtraction(JSON.stringify({ items: [{ ...item, markShape: "star" }] })), null);
});
