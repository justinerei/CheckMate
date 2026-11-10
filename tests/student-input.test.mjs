import { test } from "node:test";
import assert from "node:assert/strict";
import { studentName, normalizeStudentCode } from "../src/lib/student-input.ts";
import { createStudentCode } from "../src/lib/student-code.ts";

test("validates student names without rejecting international characters", () => {
  assert.equal(studentName("  José Dela Cruz  "), "José Dela Cruz");
  assert.equal(studentName("  "), null);
  assert.equal(studentName("x".repeat(121)), null);
  assert.equal(studentName(null), null);
});

test("normalizes a complete student code and rejects incomplete codes", () => {
  assert.equal(normalizeStudentCode(" cm-abcd1234-5678abcd-12345678-abcdef01 "), "CM-ABCD1234-5678ABCD-12345678-ABCDEF01");
  assert.equal(normalizeStudentCode("CM-1234"), null);
  assert.equal(normalizeStudentCode("CM-ABCD1234-5678ABCD-12345678-ABCDEFGH"), null);
});

test("generates distinct 128-bit codes in the supported format", () => {
  const first = createStudentCode();
  const second = createStudentCode();
  assert.equal(normalizeStudentCode(first), first);
  assert.equal(first.length, 38);
  assert.notEqual(first, second);
});
