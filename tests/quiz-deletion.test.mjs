import { test } from "node:test";
import assert from "node:assert/strict";
import { removeQuizIfEmpty } from "../src/lib/quiz-deletion.ts";

test("deletion targets only the owner's quiz with no dependent records", async () => {
  let where;
  const tx = { quiz: { deleteMany: async args => { where = args.where; return { count: 1 }; } } };
  assert.equal(await removeQuizIfEmpty(tx, "quiz-1", "teacher-1"), true);
  assert.equal(where.id, "quiz-1");
  assert.equal(where.teacherId, "teacher-1");
  assert.deepEqual(where.submissions, { none: {} });
  assert.deepEqual(where.batches, { none: {} });
  assert.deepEqual(where.sections.none.questions.some.answerKey.is.history.some, {});
});

test("reports when no eligible quiz was deleted", async () => {
  const tx = { quiz: { deleteMany: async () => ({ count: 0 }) } };
  assert.equal(await removeQuizIfEmpty(tx, "quiz-1", "teacher-2"), false);
});


test("archiving and restoring are scoped to the quiz owner and current state", async () => {
  const { updateQuizArchiveState } = await import("../src/lib/quiz-deletion.ts");
  const calls = [];
  const tx = { quiz: { updateMany: async args => { calls.push(args); return { count: 1 }; } } };
  assert.equal(await updateQuizArchiveState(tx, "quiz-1", "teacher-1", true), true);
  assert.equal(calls[0].where.teacherId, "teacher-1");
  assert.equal(calls[0].where.archivedAt, null);
  assert.ok(calls[0].data.archivedAt instanceof Date);
  assert.equal(await updateQuizArchiveState(tx, "quiz-1", "teacher-1", false), true);
  assert.deepEqual(calls[1].where.archivedAt, { not: null });
  assert.equal(calls[1].data.archivedAt, null);
});
