// Server-only helpers for the Lovable AI Gateway.
const BASE = "https://ai.gateway.lovable.dev/v1";

export class ProviderError extends Error {
  constructor(public code: "PROVIDER_UNAVAILABLE" | "PROCESSING_FAILED" | "QUOTA_EXCEEDED", public status: number) {
    super(code);
  }
}

function key() {
  const k = process.env["LOVABLE_API_KEY"];
  if (!k) throw new ProviderError("PROCESSING_FAILED", 401);
  return k;
}

function mapStatus(status: number) {
  if (status === 429 || status >= 500) return new ProviderError("PROVIDER_UNAVAILABLE", status);
  return new ProviderError("PROCESSING_FAILED", status);
}

async function readSSE(res: Response, onEvent: (e: Record<string, unknown>) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try { onEvent(JSON.parse(data)); } catch { /* ignore partial */ }
    }
  }
}

export async function transcribeWav(wavBase64: string, language?: string): Promise<string> {
  const bytes = Uint8Array.from(atob(wavBase64), (c) => c.charCodeAt(0));
  const form = new FormData();
  form.append("model", "google/gemini-3.5-transcribe");
  form.append("file", new File([bytes], "chunk.wav", { type: "audio/wav" }));
  form.append("response_format", "json");
  form.append("stream", "true");
  if (language) form.append("language", language);
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: form,
  });
  if (!res.ok) {
    console.error("transcribe failed", res.status, await res.text().catch(() => ""));
    throw mapStatus(res.status);
  }
  let deltas = "";
  let final: string | null = null;
  await readSSE(res, (e) => {
    if (e["type"] === "transcript.text.delta" && typeof e["delta"] === "string") deltas += e["delta"];
    if (e["type"] === "transcript.text.done" && typeof e["text"] === "string") final = e["text"];
  });
  return (final ?? deltas).trim();
}

/** Convert Devanagari Hindi to Roman-script Hinglish; English words stay as English. */
export async function toHinglish(lines: string[]): Promise<string[]> {
  if (!lines.length) return lines;
  const prompt =
    "Transliterate each line below from Hindi (Devanagari) into Roman-script Hinglish as Indian creators type it. " +
    "Keep English words in normal English spelling. Do not translate, add or remove words. " +
    "Return ONLY a JSON array of strings with exactly " + lines.length + " items in the same order.\n\n" +
    JSON.stringify(lines);
  const res = await fetch(`${BASE}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key(), Authorization: `Bearer ${key()}`, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: prompt,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
    }),
  });
  if (!res.ok) {
    console.error("hinglish failed", res.status, await res.text().catch(() => ""));
    throw mapStatus(res.status);
  }
  let text = "";
  await readSSE(res, (e) => {
    if (e["type"] === "response.output_text.delta" && typeof e["delta"] === "string") text += e["delta"];
  });
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new ProviderError("PROCESSING_FAILED", 200);
  const arr = JSON.parse(m[0]);
  if (!Array.isArray(arr) || arr.length !== lines.length) throw new ProviderError("PROCESSING_FAILED", 200);
  return arr.map(String);
}
