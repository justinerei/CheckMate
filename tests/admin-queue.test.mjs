import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eligibleVisiblePageIds, initialQueueStatus, matchesQueueStatus } from '../src/lib/admin-queue.ts';

test('default queue shows failed pages while explicit status links remain available', () => {
  assert.equal(initialQueueStatus(), 'NEEDS_ATTENTION');
  assert.equal(initialQueueStatus('COMPLETE'), 'COMPLETE');
  assert.equal(initialQueueStatus('PENDING'), 'PENDING');
  assert.equal(initialQueueStatus('FAILED'), 'FAILED');
  assert.equal(initialQueueStatus('unknown'), 'NEEDS_ATTENTION');
  assert.equal(matchesQueueStatus({status: 'FAILED'}, 'NEEDS_ATTENTION'), true);
  assert.equal(matchesQueueStatus({status: 'COMPLETE'}, 'NEEDS_ATTENTION'), false);
  assert.equal(matchesQueueStatus({status: 'COMPLETE'}, 'ALL'), true);
});

test('only visible pages eligible for retry can be selected, capped at 100', () => {
  const pages = [
    { id: 'ready', status: 'FAILED', retryAt: null, batch: true, inReview: true },
    { id: 'scheduled', status: 'FAILED', retryAt: '2026-01-01', batch: true, inReview: true },
    { id: 'individual', status: 'FAILED', retryAt: null, batch: false, inReview: true },
    { id: 'closed', status: 'FAILED', retryAt: null, batch: true, inReview: false },
    { id: 'pending', status: 'PENDING', retryAt: null, batch: true, inReview: true },
  ];
  assert.deepEqual(eligibleVisiblePageIds(pages, 'FAILED'), ['ready']);
  assert.deepEqual(eligibleVisiblePageIds(pages, 'NEEDS_ATTENTION'), ['ready']);
  assert.deepEqual(eligibleVisiblePageIds(pages, 'PENDING'), []);
  assert.equal(eligibleVisiblePageIds(Array.from({length: 120}, (_, i) => ({...pages[0], id: String(i)})), 'ALL').length, 100);
});
