import { test } from "node:test";
import assert from "node:assert/strict";
import { deletionBlocked } from "../src/lib/deletion-policy.ts";

test("deletion is blocked while any page is processing", () => {
  assert.equal(deletionBlocked([{ status: "COMPLETE" }, { status: "PROCESSING" }]), true);
  assert.equal(deletionBlocked([{ status: "PENDING" }, { status: "FAILED" }]), false);
  assert.equal(deletionBlocked([]), false);
});
