import { test } from "node:test";
import assert from "node:assert/strict";
import { paperBackDestination, paperReviewUrl, quizChildBackDestination } from "../src/lib/back-navigation.ts";

test("paper back follows the selected workspace with safe fallbacks", () => {
  const paper = { id: "p/1", quizId: "q/1", batchId: "b/1" };
  assert.deepEqual(paperBackDestination(paper, "quiz"), { href: "/quizzes/q%2F1/overview", label: "Back to quiz" });
  assert.deepEqual(paperBackDestination(paper, "papers"), { href: "/submissions", label: "Back to student papers" });
  assert.deepEqual(paperBackDestination(paper, "dashboard"), { href: "/dashboard", label: "Back to dashboard" });
  assert.deepEqual(paperBackDestination(paper, "https://evil.test"), { href: "/batches/b%2F1", label: "Back to batch" });
  assert.deepEqual(paperBackDestination({ ...paper, batchId: null }, "batch"), { href: "/submissions", label: "Back to student papers" });
});

test("photo to review return retains only supported origins", () => {
  assert.equal(paperReviewUrl("p/1", "quiz"), "/submissions/p%2F1/review?from=quiz");
  assert.equal(paperReviewUrl("p/1", "https://evil.test"), "/submissions/p%2F1/review");
  assert.deepEqual(paperBackDestination({ id: "p", quizId: "q", batchId: "b" }, "review", "papers"), { href: "/submissions/p/review?from=papers", label: "Back to review" });
});

test("quiz child navigation returns to its declared parent", () => {
  assert.deepEqual(quizChildBackDestination("q/1", "editor"), { href: "/quizzes/q%2F1", label: "Back to quiz editor" });
  assert.deepEqual(quizChildBackDestination("q/1", "unexpected"), { href: "/quizzes/q%2F1/overview", label: "Back to quiz" });
});

test("student history opens a paper and returns to that student's history", () => {
  assert.equal(paperReviewUrl("p/1", "students"), "/submissions/p%2F1/review?from=students");
  assert.deepEqual(paperBackDestination({ id: "p", quizId: "q", batchId: "b", studentId: "s/1" }, "students"), { href: "/students?student=s%2F1#student-s%2F1", label: "Back to student history" });
  assert.deepEqual(paperBackDestination({ id: "p", quizId: "q", batchId: null, studentId: null }, "students"), { href: "/students", label: "Back to students" });
});
