import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const visionSource = (await readFile(new URL("../src/lib/vision-fallback.ts", import.meta.url), "utf8")).replace('"./extraction"', JSON.stringify(new URL("../src/lib/extraction.ts", import.meta.url).href));
const { visionFallback } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(visionSource)).toString("base64")}`);
const { geminiText } = await import("../src/lib/gemini.ts");

test("vision and text fallbacks use the other provider only when needed", async () => {
  const originalFetch = globalThis.fetch;
  const groq = process.env.GROQ_API_KEY, gemini = process.env.GEMINI_API_KEY;
  process.env.GROQ_API_KEY = "test"; process.env.GEMINI_API_KEY = "test";
  const calls = [];
  const valid = JSON.stringify({ items: [{ number: 1 }] });
  try {
    globalThis.fetch = async url => { calls.push(url); return Response.json({ choices: [{ message: { content: valid } }] }); };
    assert.equal((await visionFallback("test", Buffer.from("x"), data => Array.isArray(data.items) ? data : null)).kind, "ok");
    assert.equal(calls.length, 1);
    calls.length = 0;
    globalThis.fetch = async url => { calls.push(url); return calls.length === 1 ? Response.json({ choices: [{ message: { content: "{}" } }] }) : Response.json({ candidates: [{ content: { parts: [{ text: valid }] } }] }); };
    assert.equal((await visionFallback("test", Buffer.from("x"), data => Array.isArray(data.items) ? data : null)).kind, "ok");
    assert.match(calls[0], /groq/); assert.match(calls[1], /googleapis/);
    calls.length = 0;
    globalThis.fetch = async url => { calls.push(url); return calls.length === 1 ? new Response("", { status: 503 }) : Response.json({ choices: [{ message: { content: valid } }] }); };
    assert.equal((await geminiText("test")).kind, "ok");
    assert.match(calls[0], /googleapis/); assert.match(calls[1], /groq/);
    calls.length = 0;
    globalThis.fetch = async url => { calls.push(url); return new Response("", { status: 429, headers: { "Retry-After": "30" } }); };
    const limited = await visionFallback("test", Buffer.from("x"), () => null);
    assert.equal(limited.kind, "error"); assert.equal(limited.limited, true); assert.equal(limited.retryAfterSeconds, 30);
  } finally {
    globalThis.fetch = originalFetch;
    if (groq === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = groq;
    if (gemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = gemini;
  }
});
