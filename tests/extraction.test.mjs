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

test("accepts an optional suggested name while rejecting invalid name data", () => {
  const item = { number: 1, section: null, answer: "B", status: "clear", note: "" };
  assert.equal(parseExtraction(JSON.stringify({ studentName: "Alex Sample", items: [item] }))?.studentName, "Alex Sample");
  assert.equal(parseExtraction(JSON.stringify({ studentName: null, items: [item] }))?.studentName, null);
  assert.equal(parseExtraction(JSON.stringify({ studentName: "x".repeat(121), items: [item] })), null);
  assert.equal(parseExtraction(JSON.stringify({ studentName: 42, items: [item] })), null);
});

test("validates observed answer styles without deciding correctness", () => {
  const item = { number: 1, section: null, answer: "B", status: "clear", note: "", observedStyle: "underline" };
  assert.equal(parseExtraction(JSON.stringify({ items: [item] }))?.items[0].observedStyle, "underline");
  assert.equal(parseExtraction(JSON.stringify({ items: [{ ...item, observedStyle: "incorrect" }] })), null);
  assert.equal(parseExtraction(JSON.stringify({ items: [{ ...item, observedStyle: "unknown" }] }))?.items[0].observedStyle, "unknown");
});

test("group review only includes clear matching styles that have not been saved", async () => {
  const { canConfirmClearSuggestion } = await import("../src/lib/extraction.ts");
  const item = { number: 1, section: null, answer: "B", status: "clear", note: "", observedStyle: "written" };
  assert.equal(canConfirmClearSuggestion([item], "text", "MULTIPLE_CHOICE", false), true);
  for (const style of ["circle", "box", "underline", "shade", "unknown"]) assert.equal(canConfirmClearSuggestion([{ ...item, observedStyle: style }], "written", "MULTIPLE_CHOICE", false), false);
  assert.equal(canConfirmClearSuggestion([{ ...item, status: "blank", answer: null }], "written", "MULTIPLE_CHOICE", false), false);
  assert.equal(canConfirmClearSuggestion([{ ...item, status: "unclear" }], "written", "MULTIPLE_CHOICE", false), false);
  assert.equal(canConfirmClearSuggestion([item, item], "written", "MULTIPLE_CHOICE", false), false);
  assert.equal(canConfirmClearSuggestion([item], "written", "ESSAY", false), false);
  assert.equal(canConfirmClearSuggestion([item], "written", "MULTIPLE_CHOICE", true), false);
  assert.equal(canConfirmClearSuggestion([{ ...item, observedStyle: "circle" }], "circle", "MULTIPLE_CHOICE", false), true);
});

test("answers from separate pages map to one quiz and duplicate readings remain ambiguous", async () => {
  const { canConfirmClearSuggestion } = await import("../src/lib/extraction.ts");
  const questions = [{ id: "first", number: 1, section: 1 }, { id: "second", number: 2, section: 1 }];
  const page1 = [{ number: 1, section: null, answer: "A", status: "clear", note: "", observedStyle: "written" }];
  const page2 = [{ number: 2, section: null, answer: "B", status: "clear", note: "", observedStyle: "written" }];
  const combined = matchCandidates(questions, [...page1, ...page2]);
  assert.equal(combined.byQuestion.first[0].answer, "A");
  assert.equal(combined.byQuestion.second[0].answer, "B");
  assert.equal(canConfirmClearSuggestion(matchCandidates(questions, [...page1, ...page1]).byQuestion.first, "written", "MULTIPLE_CHOICE", false), false);
});

test("preserves erasure observations and rejects unknown values", () => {
  const item = { number: 1, section: null, answer: "B", status: "clear", note: "", erasure: "present" };
  assert.equal(parseExtraction(JSON.stringify({ items: [item] }))?.items[0].erasure, "present");
  assert.equal(parseExtraction(JSON.stringify({ items: [{ ...item, erasure: "maybe" }] })), null);
  assert.equal(parseExtraction(JSON.stringify({ items: [{ ...item, erasure: undefined }] }))?.items[0].erasure, undefined);
});

test("suggests the only clear page reading for teacher review without resolving conflicts", async () => {
  const { preferredReviewCandidate } = await import("../src/lib/extraction.ts");
  const blank = { page: 1, item: { number: 7, section: null, status: "blank", answer: null, note: "" } };
  const clear = { page: 2, item: { number: 7, section: null, status: "clear", answer: "C", note: "" } };
  assert.equal(preferredReviewCandidate([blank, clear]), clear);
  assert.equal(preferredReviewCandidate([clear, { ...clear, page: 3 }]), null);
  assert.equal(preferredReviewCandidate([clear, { ...blank, item: { ...blank.item, status: "unclear" } }]), null);
  assert.equal(preferredReviewCandidate([blank]), blank);
  assert.equal(needsReview([blank.item, clear.item], false), true);
});
