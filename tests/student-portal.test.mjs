import test from "node:test";
import assert from "node:assert/strict";
import { newStudentInviteCode, studentInviteHash, validStudentInviteCode, releasedStudentResults } from "../src/lib/student-portal.ts";

test("student invite codes are high-entropy, validated and stored as hashes", () => {
  const first = newStudentInviteCode();
  const second = newStudentInviteCode();
  assert.equal(first.length, 43);
  assert.notEqual(first, second);
  assert.equal(validStudentInviteCode(first), true);
  assert.equal(validStudentInviteCode("student-123"), false);
  assert.equal(studentInviteHash(first).length, 64);
  assert.notEqual(studentInviteHash(first), first);
  assert.equal(studentInviteHash(` ${first} `), studentInviteHash(first));
});

test("student result query is scoped to the account and requires release and finalization", () => {
  assert.deepEqual(releasedStudentResults("student-account"), {
    student: { accountId: "student-account" },
    status: "FINALIZED",
    releasedAt: { not: null },
    totalScore: { not: null },
  });
});
