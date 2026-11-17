import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mutedNotificationKinds } from '../src/lib/admin-notification-preferences.ts';
test('new browsers mute routine notifications while preserving saved choices', () => {
  assert.deepEqual([...mutedNotificationKinds(null)], ['account', 'quiz']);
  assert.deepEqual([...mutedNotificationKinds('')], []);
  assert.deepEqual([...mutedNotificationKinds('failed,quiz')], ['failed', 'quiz']);
});
