/** Server-side Gemini text requests. Never include API keys in URLs or errors. */
async function requestGeminiText(prompt: string, temperature = 0) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { kind: "missing" as const };
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite";
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) return { kind: "config" as const };
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature, maxOutputTokens: 4096, responseMimeType: "application/json" } }),
    });
  } catch { return { kind: "network" as const }; }
  if (response.status === 429) {
    const header = response.headers.get("retry-after");
    const parsed = header && /^\d+$/.test(header) ? Math.min(Number(header), 604800) : null;
    return { kind: "limited" as const, retryAfterSeconds: parsed && parsed > 0 ? parsed : null };
  }
  if (!response.ok) return { kind: "upstream" as const, status: response.status };
  try {
    const body = await response.json();
    const parts = body?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.filter((part: { text?: unknown; thought?: boolean }) => !part.thought && typeof part.text === "string").map((part: { text: string }) => part.text).join("") : "";
    return { kind: "ok" as const, data: JSON.parse(text) as unknown };
  } catch { return { kind: "invalid" as const }; }
}

/** Text tasks prefer Gemini; Groq is used only when Gemini cannot return JSON. */
export async function geminiText(prompt: string, temperature = 0): Promise<Awaited<ReturnType<typeof requestGeminiText>>> {
  const first = await requestGeminiText(prompt, temperature);
  if (first.kind === "ok" || !process.env.GROQ_API_KEY) return first;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({ model: process.env.GROQ_TEXT_MODEL || process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b", temperature, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
    });
    if (response.status === 429 && first.kind !== "limited") {
      const header = response.headers.get("retry-after");
      const parsed = header && /^\d+$/.test(header) ? Math.min(Number(header), 604800) : null;
      return { kind: "limited", retryAfterSeconds: parsed && parsed > 0 ? parsed : null };
    }
    if (!response.ok) return first;
    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return first;
    return { kind: "ok", data: JSON.parse(content) as unknown };
  } catch { return first; }
}
