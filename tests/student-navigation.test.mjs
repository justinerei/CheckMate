import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studentResultHref, studentResultBack, studentJoinBack } from '../src/lib/student-navigation.ts';

test('results return to the page that opened them', () => {
  assert.equal(studentResultHref('p/1', {from:'overview'}), '/student/results/p%2F1?from=overview');
  assert.equal(studentResultHref('p/1', {classId:'c/1'}), '/student/results/p%2F1?fromClass=c%2F1');
  assert.deepEqual(studentResultBack('overview', undefined, null), {href:'/student', label:'Back to overview', active:'overview'});
  assert.deepEqual(studentResultBack(undefined, 'c/1', 'c/1'), {href:'/student/classes/c%2F1', label:'Back to class', active:'classes'});
  assert.deepEqual(studentResultBack('https://evil.test', 'other', 'c/1'), {href:'/student/results', label:'Back to results', active:'results'});
});

test('join cancellation only returns to supported student pages', () => {
  assert.equal(studentJoinBack('classes'), '/student/classes');
  assert.equal(studentJoinBack('https://evil.test'), '/student');
  assert.equal(studentJoinBack(null), '/student');
});
