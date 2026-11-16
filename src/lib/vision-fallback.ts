import { retryDelayMs } from "./extraction";

export type VisionFallbackResult<T> = { kind: "ok"; data: T } | { kind: "error"; limited: boolean; retryAfterSeconds?: number };

/** The validator must accept only data that the calling feature can use. */
export async function visionFallback<T>(prompt: string, image: Buffer, validate: (data: unknown) => T | null): Promise<VisionFallbackResult<T>> {
  let retrySeconds = 0;
  const attempt = async (provider: "groq" | "gemini"): Promise<T | null> => {
    const key = provider === "groq" ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY;
    const model = provider === "groq" ? process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b" : process.env.GEMINI_VISION_MODEL || process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite";
    if (!key || (provider === "gemini" && !/^[a-zA-Z0-9._-]+$/.test(model))) return null;
    try {
      const response = await fetch(provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: provider === "groq" ? { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } : { "x-goog-api-key": key, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30_000),
        body: JSON.stringify(provider === "groq" ? { model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image.toString("base64")}` } }] }] } : { contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: image.toString("base64") } }] }], generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: "application/json" } }),
      });
      if (response.status === 429) retrySeconds = Math.max(retrySeconds, Math.max(1, Math.ceil(retryDelayMs(response.headers.get("retry-after"), Date.now()) / 1000)));
      if (!response.ok) return null;
      const body = await response.json();
      const parts = body?.candidates?.[0]?.content?.parts;
      const raw = provider === "groq" ? body?.choices?.[0]?.message?.content : Array.isArray(parts) ? parts.filter((p: { thought?: boolean; text?: unknown }) => !p.thought && typeof p.text === "string").map((p: { text: string }) => p.text).join("") : "";
      return typeof raw === "string" ? validate(JSON.parse(raw)) : null;
    } catch { return null; }
  };
  const result = await attempt("groq") ?? await attempt("gemini");
  return result !== null ? { kind: "ok", data: result } : { kind: "error", limited: retrySeconds > 0, ...(retrySeconds ? { retryAfterSeconds: retrySeconds } : {}) };
}
