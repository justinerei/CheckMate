import { test } from "node:test";
import assert from "node:assert/strict";
import { isCurrentClient } from "../src/lib/prisma-client-cache.ts";

const models = { pendingPhotoDeletion: { findFirst() {} }, quizModule: { findFirst() {} } };
test("a cached client without the archive field is not reused", () => {
  assert.equal(isCurrentClient(undefined), false);
  assert.equal(isCurrentClient({}), false);
  assert.equal(isCurrentClient(models), false);
  assert.equal(isCurrentClient({ ...models, quiz: { fields: { archivedAt: {} } } }), false);
  const old = { ...models, quiz: { fields: { archivedAt: {} } }, quizSection: { fields: { questionLayout: {} } } };
  assert.equal(isCurrentClient(old), false);
  const beforeAdmin = { ...old, studentInvite: { findFirst() {} }, submission: { fields: { releasedAt: {} } } };
  assert.equal(isCurrentClient(beforeAdmin), false);
  assert.equal(isCurrentClient({ ...beforeAdmin, adminActivity: { findFirst() {} } }), true);
});
