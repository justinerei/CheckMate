import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = (await readFile(new URL("../src/lib/paper-vision.ts", import.meta.url), "utf8"))
  .replace('"./extraction"', JSON.stringify(new URL("../src/lib/extraction.ts", import.meta.url).href));
const { readPaperPhoto } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);
const valid = JSON.stringify({ items: [{ number: 1, section: null, answer: "B", status: "clear", note: "" }], document: { kind: "expected", reason: "" } });

test("paper scanning uses Groq, then Gemini without sending images to OpenRouter", async () => {
  const originalFetch = globalThis.fetch;
  const originals = { GROQ_API_KEY: process.env.GROQ_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY };
  Object.assign(process.env, { GROQ_API_KEY: "test", GEMINI_API_KEY: "test", OPENROUTER_API_KEY: "test" });
  const calls = [];
  try {
    globalThis.fetch = async url => { calls.push(url); return Response.json({ choices: [{ message: { content: valid } }] }); };
    const first = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(first.kind, "ok");
    assert.equal(calls.length, 1);
    calls.length = 0;
    globalThis.fetch = async url => { calls.push(url); return calls.length === 1 ? new Response("", { status: 429, headers: { "Retry-After": "15" } }) : Response.json({ candidates: [{ content: { parts: [{ text: valid }] } }] }); };
    const fallback = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(fallback.kind, "ok");
    assert.match(fallback.model, /^gemini:/);
    assert.equal(calls.length, 2);
    assert.match(calls[0], /api\.groq\.com/);
    assert.match(calls[1], /generativelanguage\.googleapis\.com/);
    calls.length = 0;
    globalThis.fetch = async url => { calls.push(url); return new Response("", { status: 429, headers: { "Retry-After": "60" } }); };
    const limited = await readPaperPhoto("prompt", Buffer.from("image"), "image/jpeg");
    assert.equal(limited.kind, "error");
    assert.ok(limited.retryAt instanceof Date);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originals)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
