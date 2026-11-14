import test from "node:test";
import assert from "node:assert/strict";
import { summarizeResults } from "../src/lib/quiz-results-summary.ts";

test("only finalized results with scores contribute to the average and score bands", () => {
  const result = summarizeResults([{ id: "q1", maximum: 2, type: "MULTIPLE_CHOICE" }], [
    { status: "FINALIZED", score: 1, answers: [{ questionId: "q1", objectiveScore: 1, teacherScore: null, instructionDecision: "FOLLOWED" }] },
    { status: "FINALIZED", score: 2, answers: [{ questionId: "q1", objectiveScore: 2, teacherScore: null, instructionDecision: "FOLLOWED" }] },
    { status: "IN_REVIEW", score: 0, answers: [{ questionId: "q1", objectiveScore: 0, teacherScore: null, instructionDecision: "FOLLOWED" }] },
    { status: "FINALIZED", score: null, answers: [] },
  ], 2);
  assert.equal(result.paperCount, 2); assert.equal(result.average, 1.5);
  assert.deepEqual(result.bands.map(b => b.count), [0,1,0,1]);
  assert.equal(result.items[0].average, 1.5); assert.equal(result.items[0].count, 2);
});

test("item averages include essay violations as zero and exclude missing scores", () => {
  const result = summarizeResults([{ id: "essay", maximum: 4, type: "ESSAY" }], [
    { status: "FINALIZED", score: 4, answers: [{ questionId: "essay", objectiveScore: null, teacherScore: 4, instructionDecision: "FOLLOWED" }] },
    { status: "FINALIZED", score: 0, answers: [{ questionId: "essay", objectiveScore: null, teacherScore: 3, instructionDecision: "VIOLATION" }] },
    { status: "FINALIZED", score: 1, answers: [] },
  ], 4);
  assert.equal(result.items[0].average, 2); assert.equal(result.items[0].count, 2);
  assert.equal(result.items[0].percent, 50);
});

test("empty or zero-point quizzes do not produce misleading percentages", () => {
  const result = summarizeResults([{ id: "q", maximum: 0, type: "ESSAY" }], [], 0);
  assert.equal(result.average, null); assert.equal(result.items[0].percent, null);
  assert.deepEqual(result.bands.map(b => b.count), [0,0,0,0]);
});

test("score ranges keep fractional percentages at their correct boundaries", () => {
  const scores = [49.99, 50, 74.99, 75, 89.99, 90, 100];
  const papers = scores.map(score => ({ status: "FINALIZED", score, answers: [] }));
  assert.deepEqual(summarizeResults([], papers, 100).bands.map(band => band.count), [1, 2, 2, 2]);
});
