import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validPendingGoogle } from '../src/lib/pending-google.ts';

test('pending Google identity must contain verified-session fields and be unexpired', () => {
  const identity = { googleId:'123', email:'user@example.test', name:'Example', expiresAt:2000 };
  assert.equal(validPendingGoogle(identity, 1000), true);
  assert.equal(validPendingGoogle(identity, 2000), false);
  assert.equal(validPendingGoogle({ ...identity, googleId:'' }, 1000), false);
  assert.equal(validPendingGoogle({ ...identity, expiresAt:Infinity }, 1000), false);
  assert.equal(validPendingGoogle(null, 1000), false);
});
