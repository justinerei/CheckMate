import { test } from "node:test";
import assert from "node:assert/strict";
import { googleIdentity } from "../src/lib/google-identity.ts";

test("accepts a verified Google identity", () => {
  assert.deepEqual(googleIdentity({ sub: "123", email: "teacher@example.com", email_verified: true, name: "Teacher" }), {
    googleId: "123", email: "teacher@example.com", name: "Teacher",
  });
});

test("rejects identities without a verified email or stable Google ID", () => {
  assert.equal(googleIdentity({ sub: "123", email: "teacher@example.com", email_verified: false }), null);
  assert.equal(googleIdentity({ email: "teacher@example.com", email_verified: true }), null);
});
