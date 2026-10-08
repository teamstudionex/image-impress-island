// Provider interfaces. UI never calls these; only server handlers do.
import type { ErrorCode } from "../result";

export class ProviderError extends Error {
  constructor(public code: ErrorCode, public status?: number, detail?: string) {
    super(detail ?? code);
  }
}

/** Map an HTTP status from any provider to a safe app error code. */
export function codeForStatus(status: number): ErrorCode {
  if (status === 401 || status === 403) return "PROVIDER_AUTH_FAILED";
  if (status === 413 || status === 415 || status === 400 || status === 422) return "PROVIDER_REJECTED_FILE";
  if (status === 429) return "PROVIDER_RATE_LIMIT";
  if (status === 408 || status === 504) return "PROVIDER_TIMEOUT";
  if (status >= 500) return "PROVIDER_UNAVAILABLE";
  return "PROVIDER_INVALID_RESPONSE";
}

/** fetch with timeout + retry on 429/5xx/network for idempotent provider calls. */
export async function providerFetch(url: string, init: RequestInit, opts: { timeoutMs: number; retries?: number; fetchImpl?: typeof fetch }) {
  const f = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 2;
  let lastCode: ErrorCode = "PROVIDER_UNAVAILABLE";
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeoutMs);
    try {
      const res = await f(url, { ...init, signal: ctrl.signal });
      if (res.ok) return res;
      const code = codeForStatus(res.status);
      const body = await res.text().catch(() => "");
      console.error(JSON.stringify({ evt: "provider_error", url: url.split("?")[0], status: res.status, body: body.slice(0, 300) }));
      if ((code === "PROVIDER_RATE_LIMIT" || code === "PROVIDER_UNAVAILABLE") && attempt < retries) {
        lastCode = code;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      throw new ProviderError(code, res.status);
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      lastCode = (e as Error)?.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE";
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
    } finally {
      clearTimeout(t);
    }
  }
  throw new ProviderError(lastCode);
}

export type TranscriptWord = { text: string; start: number; end: number; confidence: number; speaker?: number };
export type Transcript = { words: TranscriptWord[]; text: string; language?: string; requestId?: string };

export interface TranscriptionProvider {
  transcribe(sourceUrl: string, options: { language: string }): Promise<Transcript>;
}
export interface VoiceEnhancementProvider {
  enhance(file: Blob, filename: string): Promise<{ data: ArrayBuffer; mimeType: string }>;
}
export type RenderStatus = { status: "pending" | "rendering" | "done" | "failed"; url?: string; error?: string };
export interface MediaRenderProvider {
  render(edit: unknown): Promise<{ id: string }>;
  getRenderStatus(id: string): Promise<RenderStatus>;
}
