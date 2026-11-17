import { test } from "node:test";
import assert from "node:assert/strict";
import { paperDestination, paperStatus, quizDestination } from "../src/lib/workspace-navigation.ts";

test("paper links lead to the upload or review stage", () => {
  assert.equal(paperDestination("abc", "DRAFT"), "/submissions/abc");
  assert.equal(paperDestination("abc", "IN_REVIEW", true), "/submissions/abc/review");
  assert.equal(paperDestination("abc", "IN_REVIEW", false), "/submissions/abc");
  assert.equal(paperDestination("abc", "FINALIZED"), "/submissions/abc/review");
  assert.equal(paperStatus("IN_REVIEW"), "In review");
});

test("both quiz types open the quiz overview", () => {
  assert.equal(quizDestination("q1", "EXISTING"), "/quizzes/q1/overview");
  assert.equal(quizDestination("q1", "BUILT"), "/quizzes/q1/overview");
  assert.equal(quizDestination("a/b", "BUILT"), "/quizzes/a%2Fb/overview");
});

test("paper links preserve their entry point without changing status routing", () => {
  assert.equal(paperDestination("p/1", "IN_REVIEW", true, "quiz"), "/submissions/p%2F1/review?from=quiz");
  assert.equal(paperDestination("p/1", "DRAFT", false, "papers"), "/submissions/p%2F1?from=papers");
  assert.equal(paperDestination("p/1", "FINALIZED", true, "dashboard"), "/submissions/p%2F1/review?from=dashboard");
});

test("highlights the current workspace area, including quiz overviews", async () => {
  const { workspaceActive } = await import("../src/lib/workspace-navigation.ts");
  assert.equal(workspaceActive("/dashboard"), "overview");
  assert.equal(workspaceActive("/students"), "students");
  assert.equal(workspaceActive("/profile"), "profile");
  assert.equal(workspaceActive("/profile/settings"), "profile");
  assert.equal(workspaceActive("/quizzes"), "quizzes");
  assert.equal(workspaceActive("/quizzes/quiz-1/overview"), "quizzes");
});
