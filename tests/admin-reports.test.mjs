import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportDateRange, formatReportPeriod } from '../src/lib/admin-reports.ts';

test('quick ranges use Manila calendar dates and include today', () => {
  const now = new Date('2026-02-28T17:00:00Z');
  assert.deepEqual(reportDateRange('7', now), { from: '2026-02-23', to: '2026-03-01' });
  assert.deepEqual(reportDateRange('30', now), { from: '2026-01-31', to: '2026-03-01' });
  assert.deepEqual(reportDateRange('month', now), { from: '2026-03-01', to: '2026-03-01' });
});

test('period labels are readable and preserve week start', () => {
  assert.equal(formatReportPeriod('2026-11', 'month'), 'November 2026');
  assert.equal(formatReportPeriod('2026-11-16', 'week'), 'Nov 16, 2026');
});
