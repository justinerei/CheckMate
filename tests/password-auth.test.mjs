import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, normalizeEmail, validRegistration } from '../src/lib/password-auth.ts';

test('password hashes verify only the original password', async () => {
  const hash = await hashPassword('correct horse battery');
  assert.notEqual(hash, 'correct horse battery');
  assert.equal(await verifyPassword('correct horse battery', hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
  assert.equal(await verifyPassword('anything', 'invalid'), false);
});

test('registration normalizes email and requires sensible input', () => {
  assert.equal(normalizeEmail('  Teacher@Example.com '), 'teacher@example.com');
  assert.equal(validRegistration('Teacher', 'teacher@example.com', 'long enough password'), true);
  assert.equal(validRegistration('', 'teacher@example.com', 'long enough password'), false);
  assert.equal(validRegistration('Teacher', 'bad', 'long enough password'), false);
  assert.equal(validRegistration('Teacher', 'teacher@example.com', 'short'), false);
});
