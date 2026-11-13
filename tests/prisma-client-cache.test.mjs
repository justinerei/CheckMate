import { test } from "node:test";
import assert from "node:assert/strict";
import { isCurrentClient } from "../src/lib/prisma-client-cache.ts";

test("a cached client missing required models is not reused", () => {
  assert.equal(isCurrentClient(undefined), false);
  assert.equal(isCurrentClient({}), false);
  assert.equal(isCurrentClient({ pendingPhotoDeletion: {} }), false);
  assert.equal(isCurrentClient({ pendingPhotoDeletion: { findFirst() {} } }), false);
  assert.equal(isCurrentClient({ pendingPhotoDeletion: { findFirst() {} }, quizModule: { findFirst() {} } }), true);
});
