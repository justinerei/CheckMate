import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeAccountAccess } from '../src/lib/admin-activity.ts';

test('access change only targets teacher or student and writes the correct audit event', async () => {
  let filter; let event;
  const tx = { user: { async updateMany(args) { filter = args; return { count: 1 }; } }, adminActivity: { async create(args) { event = args.data; } } };
  assert.equal(await changeAccountAccess(tx, 'admin', 'teacher', false), true);
  assert.deepEqual(filter, { where: { id: 'teacher', role: { in: ['TEACHER', 'STUDENT'] }, enabled: true }, data: { enabled: false } });
  assert.deepEqual(event, { actorId: 'admin', targetId: 'teacher', action: 'ACCOUNT_DISABLED' });
  await changeAccountAccess(tx, 'admin', 'student', true);
  assert.equal(event.action, 'ACCOUNT_ENABLED');
});

test('unchanged or unavailable accounts do not produce an audit event', async () => {
  const tx = { user: { async updateMany() { return { count: 0 }; } }, adminActivity: { async create() { assert.fail('No event should be written'); } } };
  assert.equal(await changeAccountAccess(tx, 'admin', 'missing', false), false);
});

test('an audit write failure is propagated so the enclosing transaction can roll back', async () => {
  const tx = { user: { async updateMany() { return { count: 1 }; } }, adminActivity: { async create() { throw new Error('audit unavailable'); } } };
  await assert.rejects(() => changeAccountAccess(tx, 'admin', 'teacher', false), /audit unavailable/);
});
