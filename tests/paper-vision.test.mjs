import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

// The app bundler resolves extensionless imports; use a file URL for Node's test runner.
const source = (await readFile(new URL("../src/lib/paper-vision.ts", import.meta.url), "utf8"))
  .replace('"./extraction"', JSON.stringify(new URL("../src/lib/extraction.ts", import.meta.url).href));
const { readPaperPhoto, GROQ_SHORT_WAIT } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);
const valid = JSON.stringify({ items: [{ number: 1, section: null, answer: "B", status: "clear", note: "" }], document: { kind: "expected", reason: "" } });

test("paper vision tries Gemini only after Groq fails, and preserves retry when both are limited", async () => {
  const originalFetch = globalThis.fetch;
  const originalGroq = process.env.GROQ_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;
  process.env.GROQ_API_KEY = "test";
  process.env.GEMINI_API_KEY = "test";
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
  } finally {
    globalThis.fetch = originalFetch;
    if (originalGroq === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalGroq;
    if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
  }
});
