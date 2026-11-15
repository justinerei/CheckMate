import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestEssayScores } from '../src/lib/essay-suggestion.ts';

const criteria = [{ id: 'accuracy', title: 'Accuracy', description: 'Correct facts', maxPoints: 2 }];

test('essay suggestions use Gemini and preserve valid criterion scores', async () => {
  let prompt = '';
  const result = await suggestEssayScores('Explain', 'Student response', criteria, async value => {
    prompt = value;
    return { kind: 'ok', data: { assessments: [{ id: 'accuracy', score: 1, feedback: 'Partial' }] } };
  });
  assert.match(prompt, /Student response/);
  assert.deepEqual(result, { kind: 'ok', assessments: [{ id: 'accuracy', score: 1, feedback: 'Partial' }] });
});

test('essay suggestions reject out-of-range scores and preserve rate limits', async () => {
  const invalid = await suggestEssayScores('Q', 'A', criteria, async () => ({ kind: 'ok', data: { assessments: [{ id: 'accuracy', score: 3, feedback: '' }] } }));
  assert.equal(invalid.kind, 'invalid');
  const limited = await suggestEssayScores('Q', 'A', criteria, async () => ({ kind: 'limited', retryAfterSeconds: 12 }));
  assert.deepEqual(limited, { kind: 'limited', retryAfterSeconds: 12 });
});
