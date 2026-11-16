import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

// The app bundler resolves extensionless imports; use a file URL for Node's test runner.
const source = (await readFile(new URL("../src/lib/paper-vision.ts", import.meta.url), "utf8"))
  .replace('"./extraction"', JSON.stringify(new URL("../src/lib/extraction.ts", import.meta.url).href));
const { readPaperPhoto, GROQ_SHORT_WAIT } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);
const valid = JSON.stringify({ items: [{ number: 1, section: null, answer: "B", status: "clear", note: "" }], document: { kind: "expected", reason: "" } });

test("paper vision prefers Groq, then OpenRouter, then Gemini", async () => {
  const originalFetch = globalThis.fetch;
  const originalGroq = process.env.GROQ_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalOpenRouter = process.env.OPENROUTER_API_KEY;
  process.env.GROQ_API_KEY = "test";
  process.env.GEMINI_API_KEY = "test";
  delete process.env.OPENROUTER_API_KEY;
  let calls = [];
  try {
    globalThis.fetch = async url => { calls.push(url); return Response.json({ choices: [{ message: { content: valid } }] }); };
    assert.equal((await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg")).kind, "ok");
    assert.equal(calls.length, 1);

    calls = [];
    globalThis.fetch = async url => { calls.push(url); return calls.length === 1 ? new Response("", { status: 429, headers: { "Retry-After": "120" } }) : Response.json({ candidates: [{ content: { parts: [{ text: valid }] } }] }); };
    const fallback = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(fallback.kind, "ok");
    assert.match(fallback.model, /^gemini:/);
    assert.equal(calls.length, 2);

    calls = [];
    globalThis.fetch = async url => { calls.push(url); return new Response("", { status: 429, headers: { "Retry-After": "15" } }); };
    const waiting = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(waiting.kind, "error");
    assert.equal(waiting.message, GROQ_SHORT_WAIT);
    assert.ok(waiting.retryAt instanceof Date);
    assert.equal(calls.length, 1);

    calls = [];
    globalThis.fetch = async url => { calls.push(url); return calls.length === 1 ? new Response("", { status: 429, headers: { "Retry-After": "15" } }) : Response.json({ candidates: [{ content: { parts: [{ text: valid }] } }] }); };
    const afterRetry = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg", waiting.message);
    assert.equal(afterRetry.kind, "ok");
    assert.match(afterRetry.model, /^gemini:/);
    assert.equal(calls.length, 2);

    globalThis.fetch = async () => new Response("", { status: 429, headers: { "Retry-After": "120" } });
    const limited = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(limited.kind, "error");
    assert.ok(limited.retryAt instanceof Date);

    process.env.OPENROUTER_API_KEY = "test";
    calls = [];
    globalThis.fetch = async url => { calls.push(url); return new Response("", { status: 429, headers: { "Retry-After": "15" } }); };
    const shortWaitWithFallbacks = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(shortWaitWithFallbacks.kind, "error");
    assert.equal(shortWaitWithFallbacks.message, GROQ_SHORT_WAIT);
    assert.equal(calls.length, 1);

    calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) return new Response("", { status: 503 });
      return Response.json({ choices: [{ message: { content: valid } }] });
    };
    const third = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(third.kind, "ok");
    assert.match(third.model, /^openrouter:.*:free$/);
    const request = JSON.parse(calls[1].options.body);
    assert.equal(request.provider.zdr, true);
    assert.equal(request.provider.data_collection, "deny");
    assert.equal(request.provider.max_price.prompt, 0);
    assert.equal(calls.length, 2);
    assert.match(calls[1].url, /openrouter\.ai/);

    calls = [];
    globalThis.fetch = async url => {
      calls.push(url);
      if (calls.length < 3) return new Response("", { status: 503 });
      return Response.json({ candidates: [{ content: { parts: [{ text: valid }] } }] });
    };
    const lastFallback = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(lastFallback.kind, "ok");
    assert.match(lastFallback.model, /^gemini:/);
    assert.match(calls[1], /openrouter\.ai/);
    assert.match(calls[2], /generativelanguage\.googleapis\.com/);
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalGroq === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalGroq;
    if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
    if (originalOpenRouter === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalOpenRouter;
  }
});
