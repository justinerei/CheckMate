import { test } from "node:test";
import assert from "node:assert/strict";
import { answerKeyReturnPath } from "../src/lib/answer-key-navigation.ts";

test("a saved key returns to its intended workflow", () => {
  assert.equal(answerKeyReturnPath("key 1", true), "/submissions/new?quizId=key%201&saved=1");
  assert.equal(answerKeyReturnPath("key 1", false), "/quizzes/existing/key%201?saved=1");
});
