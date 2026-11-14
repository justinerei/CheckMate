import test from "node:test";
import assert from "node:assert/strict";
import { studentLinkProblem } from "../src/lib/student-paper-link.ts";

test("student linking requires an available paper and a student on the teacher list", () => {
  assert.match(studentLinkProblem(false, true, false), /unavailable/i);
  assert.match(studentLinkProblem(true, false, false), /student list/i);
  assert.equal(studentLinkProblem(true, true, false), null);
});

test("duplicate student papers are rejected while unlinking is allowed", () => {
  assert.match(studentLinkProblem(true, true, true), /already.*paper/i);
  assert.equal(studentLinkProblem(true, true, false), null);
});

test("student links can change on finalized papers as well as papers in review", async () => {
  const { studentLinkStatuses } = await import("../src/lib/student-paper-link.ts");
  assert.deepEqual(studentLinkStatuses, ["IN_REVIEW", "FINALIZED"]);
  assert.equal(studentLinkStatuses.includes("DRAFT"), false);
});
