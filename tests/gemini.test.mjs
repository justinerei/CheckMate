import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiText } from '../src/lib/gemini.ts';

test('Gemini text requests keep credentials in headers and parse JSON output', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  globalThis.fetch = async (url, options) => {
    assert.ok(!String(url).includes('test-key'));
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    return Response.json({ candidates: [{ content: { parts: [{ text: '{"questions":[]}' }] } }] });
  };
  try { assert.deepEqual(await geminiText('test'), { kind: 'ok', data: { questions: [] } }); }
  finally { globalThis.fetch = previousFetch; if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; }
});

test('Gemini rate limit without retry header does not invent a wait time', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response('', { status: 429 });
  try { assert.deepEqual(await geminiText('test'), { kind: 'limited', retryAfterSeconds: null }); }
  finally { globalThis.fetch = previousFetch; if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; }
});
