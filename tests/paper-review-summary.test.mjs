import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/lib/paper-review-summary.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exports = {};
new Function("require", "exports", compiled)((name) => name.startsWith("@/lib/") ? require(`../src/lib/${name.slice(6)}.ts`) : require(name), exports);
const { paperReviewSummary } = exports;

const question = { id: "q1", number: 1, section: 1, type: "TRUE_FALSE", answerStyle: "written", instructions: "", points: 1, answerKey: { acceptedAnswers: ["T"] } };
const reading = { number: 1, section: 1, answer: "T", status: "clear", note: "", erasure: "none" };
const page = (items, status = "COMPLETE") => ({ pageNumber: 1, status, extraction: { items } });
const paper = (items = [reading]) => ({ expectedPages: 1, nameReviewed: true, pages: [page(items)], answers: [] });

test("summary matches automatic scoring and reports pending review and name", () => {
  assert.deepEqual(paperReviewSummary(paper(), [question], "BUILT"), { flagged: 0, unmatchedBlocked: false, finalizationBlocked: false, finalizationReason: null, nameReviewed: true, proposed: 1 });
  assert.deepEqual(paperReviewSummary(paper([{ ...reading, answer: "F" }]), [question], "BUILT"), { flagged: 0, unmatchedBlocked: false, finalizationBlocked: false, finalizationReason: null, nameReviewed: true, proposed: 0 });
  assert.equal(paperReviewSummary(paper([{ ...reading, status: "unclear" }]), [question], "BUILT").flagged, 1);
  assert.equal(paperReviewSummary({ ...paper(), nameReviewed: false }, [question], "BUILT").nameReviewed, false);
});

test("unmatched readings, unprocessed pages and manual confirmations stay aligned with review rules", () => {
  const extra = { ...reading, number: 7 };
  assert.equal(paperReviewSummary(paper([reading, extra]), [question], "BUILT").unmatchedBlocked, true);
  assert.equal(paperReviewSummary({ ...paper(), pages: [page([reading], "PENDING")] }, [question], "BUILT").flagged, 1);
  const answer = { questionId: "q1", reviewStatus: "CONFIRMED", confirmedText: "T", instructionDecision: "FOLLOWED", objectiveScore: null, teacherScore: null };
  assert.equal(paperReviewSummary({ ...paper([reading, extra]), answers: [answer] }, [question], "BUILT").unmatchedBlocked, false);
});


test("ready status is blocked by missing pages, invalid readings or answer keys", () => {
  assert.match(paperReviewSummary({ ...paper(), pages: [] }, [question], "BUILT").finalizationReason, /pages/);
  assert.match(paperReviewSummary({ ...paper(), pages: [{ pageNumber: 1, status: "COMPLETE", extraction: null }] }, [question], "BUILT").finalizationReason, /checking all pages/);
  assert.match(paperReviewSummary(paper(), [{ ...question, answerKey: null }], "BUILT").finalizationReason, /answer key/);
});

test("blank and clear readings from separate photos still require a teacher decision", () => {
  const duplicate = { ...paper(), expectedPages: 2, pages: [page([{ ...reading, answer: null, status: "blank", observedStyle: "unknown" }]), { ...page([reading]), pageNumber: 2 }] };
  const summary = paperReviewSummary(duplicate, [question], "BUILT");
  assert.equal(summary.flagged, 1);
  assert.equal(summary.proposed, 0);
});
