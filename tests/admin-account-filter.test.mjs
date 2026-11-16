import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterAdminAccounts } from '../src/lib/admin-account-filter.ts';

const users = [
  { name: 'Anna Cruz', email: 'anna@example.test', role: 'TEACHER', enabled: true },
  { name: 'Ben Santos', email: 'ben@example.test', role: 'STUDENT', enabled: false },
];
test('search accepts case-insensitive names and email and composes with filters', () => {
  assert.deepEqual(filterAdminAccounts(users, '  ANNA  ', 'TEACHER', 'ACTIVE'), [users[0]]);
  assert.deepEqual(filterAdminAccounts(users, 'EXAMPLE.TEST', 'STUDENT', 'DISABLED'), [users[1]]);
  assert.deepEqual(filterAdminAccounts(users, 'ben', 'STUDENT', 'ACTIVE'), []);
  assert.deepEqual(filterAdminAccounts(users, '', 'ALL', 'ALL'), users);
});
