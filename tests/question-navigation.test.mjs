import test from 'node:test';
import assert from 'node:assert/strict';
import { questionNavigation } from '../src/lib/question-navigation.ts';

test('question navigation respects section numbering and completion', () => {
  const sections = [{ id: 'a', title: 'Choice', questions: [{ id: '1', complete: true }, { id: '2', complete: false }] }, { id: 'b', title: 'Essay', questions: [{ id: '3', complete: false }] }];
  assert.deepEqual(questionNavigation(sections, 'CONTINUOUS').map(s => s.questions.map(q => q.number)), [[1, 2], [3]]);
  assert.deepEqual(questionNavigation(sections, 'RESET_PER_SECTION').map(s => s.questions.map(q => q.number)), [[1, 2], [1]]);
  assert.equal(questionNavigation(sections, 'CONTINUOUS')[0].questions[0].complete, true);
});
