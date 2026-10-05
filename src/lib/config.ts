// Product configuration. Every fact shown in marketing copy or limits comes from here.
export const CONFIG = {
  companyName: "Capsy",
  supportEmail: "teamstudionex@gmail.com",
  maxFileBytes: 500 * 1024 * 1024,
  maxDurationMs: 30 * 60 * 1000,
  monthlyMinutes: 120,
  retentionDays: 7,
  termsVersion: "2026-10-05",
  acceptedExtensions: ["mp4", "mov", "webm", "mp3", "wav", "m4a"],
  acceptedMime: ["video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/wave", "audio/mp4", "audio/x-m4a", "audio/webm"],
} as const;

export type LanguageId = "en" | "hi" | "hinglish";

// Languages offered in the product. Only listed here after a real transcription check.
export const ENABLED_LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "hinglish", label: "Hinglish" },
];

export const INTENTS = ["captions", "voice-enhancer", "silence-cutter"] as const;
export type Intent = (typeof INTENTS)[number];

export function formatBytes(n: number) {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}h ${m % 60}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function safeNext(next: unknown): string {
  if (typeof next !== "string") return "/app";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/app";
  return next;
}
