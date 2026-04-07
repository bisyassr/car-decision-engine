const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_PROMPT_CHARS = 24_000;
const MAX_TOKENS_CAP = 2048;

const baseHeaders = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: baseHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(503, { error: "AI is not configured on this deployment." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { prompt, max_tokens: rawMax } = body;
  if (typeof prompt !== "string") {
    return json(400, { error: "Field 'prompt' must be a string" });
  }
  if (prompt.length === 0) {
    return json(400, { error: "Empty prompt" });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return json(413, { error: "Prompt too large" });
  }

  const max_tokens = Math.min(
    MAX_TOKENS_CAP,
    Math.max(1, Number(rawMax) || 800),
  );

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return json(502, { error: "Could not reach AI service" });
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return json(502, { error: "Invalid response from AI service" });
  }

  if (!upstream.ok) {
    const safe =
      upstream.status === 429
        ? "Too many requests. Try again shortly."
        : "AI request failed";
    return json(upstream.status >= 500 ? 502 : 400, { error: safe });
  }

  const text =
    data.content?.find((b) => b.type === "text")?.text ?? "";
  return json(200, { text });
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: baseHeaders(),
    body: JSON.stringify(obj),
  };
}
