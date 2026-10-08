// Concrete provider adapters. Server-only: read keys from process.env inside calls.
import {
  ProviderError, providerFetch,
  type MediaRenderProvider, type RenderStatus, type Transcript, type TranscriptionProvider, type VoiceEnhancementProvider,
} from "./types";

const env = (k: string) => process.env[k];

export function providerStatus() {
  return {
    captions: !!env("DEEPGRAM_API_KEY"),
    voice: !!env("ELEVENLABS_API_KEY"),
    render: !!env("SHOTSTACK_API_KEY"),
  };
}

export class DeepgramTranscriptionProvider implements TranscriptionProvider {
  constructor(private fetchImpl?: typeof fetch) {}
  async transcribe(sourceUrl: string, options: { language: string }): Promise<Transcript> {
    const key = env("DEEPGRAM_API_KEY");
    if (!key) throw new ProviderError("PROVIDER_NOT_CONFIGURED");
    const q = new URLSearchParams({
      model: env("DEEPGRAM_MODEL") || "nova-3",
      smart_format: "true",
      punctuate: "true",
    });
    if (options.language === "auto") q.set("detect_language", "true");
    else if (options.language === "hinglish") q.set("language", "multi");
    else q.set("language", options.language);
    const res = await providerFetch(`https://api.deepgram.com/v1/listen?${q}`, {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceUrl }),
    }, { timeoutMs: 110_000, retries: 1, fetchImpl: this.fetchImpl });
    const json = (await res.json().catch(() => null)) as any;
    const alt = json?.results?.channels?.[0]?.alternatives?.[0];
    if (!alt || !Array.isArray(alt.words)) throw new ProviderError("PROVIDER_INVALID_RESPONSE");
    return {
      text: String(alt.transcript ?? ""),
      language: json?.results?.channels?.[0]?.detected_language,
      requestId: json?.metadata?.request_id,
      words: alt.words.map((w: any) => ({
        text: String(w.punctuated_word ?? w.word ?? ""),
        start: Math.round(Number(w.start) * 1000),
        end: Math.round(Number(w.end) * 1000),
        confidence: Number(w.confidence ?? 1),
        speaker: typeof w.speaker === "number" ? w.speaker : undefined,
      })),
    };
  }
}

export class ElevenLabsVoiceEnhancementProvider implements VoiceEnhancementProvider {
  constructor(private fetchImpl?: typeof fetch) {}
  async enhance(file: Blob, filename: string) {
    const key = env("ELEVENLABS_API_KEY");
    if (!key) throw new ProviderError("PROVIDER_NOT_CONFIGURED");
    const form = new FormData();
    form.append("audio", file, filename);
    const res = await providerFetch("https://api.elevenlabs.io/v1/audio-isolation", {
      method: "POST", headers: { "xi-api-key": key }, body: form,
    }, { timeoutMs: 110_000, retries: 1, fetchImpl: this.fetchImpl });
    const data = await res.arrayBuffer();
    if (!data.byteLength) throw new ProviderError("PROVIDER_INVALID_RESPONSE");
    return { data, mimeType: res.headers.get("content-type")?.split(";")[0] || "audio/mpeg" };
  }
}

export class ShotstackMediaRenderProvider implements MediaRenderProvider {
  constructor(private fetchImpl?: typeof fetch) {}
  private base() {
    return `https://api.shotstack.io/edit/${env("SHOTSTACK_ENV") || "stage"}`;
  }
  private key() {
    const k = env("SHOTSTACK_API_KEY");
    if (!k) throw new ProviderError("PROVIDER_NOT_CONFIGURED");
    return k;
  }
  async render(edit: unknown) {
    const res = await providerFetch(`${this.base()}/render`, {
      method: "POST", headers: { "x-api-key": this.key(), "Content-Type": "application/json" }, body: JSON.stringify(edit),
    }, { timeoutMs: 30_000, retries: 0, fetchImpl: this.fetchImpl });
    const json = (await res.json().catch(() => null)) as any;
    const id = json?.response?.id;
    if (!id) throw new ProviderError("PROVIDER_INVALID_RESPONSE");
    return { id: String(id) };
  }
  async getRenderStatus(id: string): Promise<RenderStatus> {
    const res = await providerFetch(`${this.base()}/render/${encodeURIComponent(id)}`, {
      headers: { "x-api-key": this.key() },
    }, { timeoutMs: 20_000, retries: 1, fetchImpl: this.fetchImpl });
    const json = (await res.json().catch(() => null)) as any;
    const s = json?.response?.status;
    if (!s) throw new ProviderError("PROVIDER_INVALID_RESPONSE");
    if (s === "done") return { status: "done", url: json.response.url };
    if (s === "failed") return { status: "failed", error: String(json.response.error ?? "") };
    if (s === "rendering" || s === "saving") return { status: "rendering" };
    return { status: "pending" };
  }
}

/** Build a Shotstack edit that plays each keep range back-to-back with no gaps. */
export function buildSilenceEdit(o: {
  src: string; ranges: { start: number; end: number }[]; hasVideo: boolean; width?: number | null; height?: number | null;
}) {
  let offset = 0;
  const clips = o.ranges.map((r) => {
    const length = Math.round(r.end - r.start) / 1000;
    const clip = { asset: { type: o.hasVideo ? "video" : "audio", src: o.src, trim: r.start / 1000 }, start: Math.round(offset * 1000) / 1000, length };
    offset += length;
    return clip;
  });
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  const output: Record<string, unknown> = o.hasVideo
    ? o.width && o.height
      ? { format: "mp4", size: { width: even(Math.min(o.width, 1920)), height: even(o.height * Math.min(1, 1920 / o.width)) } }
      : { format: "mp4", resolution: "hd" }
    : { format: "mp3" };
  return { timeline: { tracks: [{ clips }] }, output };
}
