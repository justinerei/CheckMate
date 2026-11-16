import { parseExtraction, parseDocumentCheck, retryDelayMs } from "./extraction";

type VisionResult = { kind: "ok"; result: NonNullable<ReturnType<typeof parseExtraction>> & { document: ReturnType<typeof parseDocumentCheck> }; model: string } | { kind: "error"; message: string; retryAt: Date | null };
export const GROQ_SHORT_WAIT = "Groq is busy. Waiting briefly before retrying; Gemini is reserved as a backup.";
const MAX_GROQ_WAIT_MS = 60_000;

/** Read with Groq first, then Gemini and the free OpenRouter model if needed. */
export async function readPaperPhoto(prompt: string, photo: Buffer, mime: string, previousError?: string | null): Promise<VisionResult> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqModel = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";
  const geminiModel = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite";
  let message = groqKey ? "Groq could not read this page." : "Groq API key is missing.";
  let retryAt: Date | null = null;
  const parse = (raw: string, model: string): VisionResult | null => {
    try {
      const parsed = parseExtraction(raw);
      return parsed ? { kind: "ok", result: { ...parsed, document: parseDocumentCheck(JSON.parse(raw).document) }, model } : null;
    } catch { return null; }
  };
  if (groqKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30_000), body: JSON.stringify({ model: groqModel, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mime};base64,${photo.toString("base64")}` } }] }] }) });
      if (response.status === 429) {
        const delay = Math.max(1000, retryDelayMs(response.headers.get("retry-after"), Date.now()));
        retryAt = new Date(Date.now() + delay);
        if (delay <= MAX_GROQ_WAIT_MS && previousError !== GROQ_SHORT_WAIT) return { kind: "error", message: GROQ_SHORT_WAIT, retryAt };
        message = "Groq rate limit reached. Retry after the displayed time.";
      }
      else if (!response.ok) message = response.status === 401 ? "Groq rejected the API key. Check .env.local and restart the server." : `Groq could not process this page (HTTP ${response.status}).`;
      else {
        const body = await response.json();
        const result = parse(typeof body?.choices?.[0]?.message?.content === "string" ? body.choices[0].message.content : "", groqModel);
        if (result) return result;
        message = "Groq returned an unreadable result. Please retry this page.";
      }
    } catch { message = "Could not connect to Groq or the request timed out."; }
  }
  if (geminiKey && /^[a-zA-Z0-9._-]+$/.test(geminiModel)) try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, { method: "POST", headers: { "x-goog-api-key": geminiKey, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30_000), body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: photo.toString("base64") } }] }], generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: "application/json" } }) });
    if (response.status === 429) {
      const fallbackRetry = new Date(Date.now() + retryDelayMs(response.headers.get("retry-after"), Date.now()));
      retryAt = retryAt && retryAt > fallbackRetry ? retryAt : fallbackRetry;
      message = "Groq failed and Gemini reached a rate limit. Retry later.";
    }
    else if (!response.ok) message = `Groq failed and Gemini could not read the page (HTTP ${response.status}).`;
    else {
      const body = await response.json();
      const parts = body?.candidates?.[0]?.content?.parts;
      const raw = Array.isArray(parts) ? parts.filter((part: { text?: unknown; thought?: boolean }) => !part.thought && typeof part.text === "string").map((part: { text: string }) => part.text).join("") : "";
      const result = parse(raw, `gemini:${geminiModel}`);
      if (result) return result;
      message = "Groq failed and Gemini returned an unreadable result.";
    }
  } catch { message = "Groq failed and Gemini could not be reached. Please retry."; }
  else if (geminiKey) message = "Groq failed and the Gemini vision model setting is invalid.";

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return { kind: "error", message, retryAt };
  try {
    const model = "inclusionai/ling-3.2-flash:free";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30_000), body: JSON.stringify({ model, temperature: 0, reasoning: { enabled: false }, provider: { zdr: true, data_collection: "deny", require_parameters: true, max_price: { prompt: 0, completion: 0 } }, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mime};base64,${photo.toString("base64")}` } }] }] }) });
    if (response.status === 429) {
      const fallbackRetry = new Date(Date.now() + Math.max(1000, retryDelayMs(response.headers.get("retry-after"), Date.now())));
      return { kind: "error", message: "The reading services reached a rate limit. Try again later.", retryAt: retryAt && retryAt > fallbackRetry ? retryAt : fallbackRetry };
    }
    if (!response.ok) return { kind: "error", message: `Groq and Gemini failed; OpenRouter could not read the page (HTTP ${response.status}).`, retryAt };
    const body = await response.json();
    const raw = typeof body?.choices?.[0]?.message?.content === "string" ? body.choices[0].message.content : "";
    return parse(raw, `openrouter:${model}`) ?? { kind: "error", message: "All reading services failed to return a valid result.", retryAt };
  } catch { return { kind: "error", message: "Groq and Gemini failed, and OpenRouter could not be reached.", retryAt }; }
}
