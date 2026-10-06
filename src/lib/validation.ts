// Client + server validation shared by forms and server functions.
import { z } from "zod";
import { CONFIG } from "./config";
import type { ErrorCode } from "./result";

export const ProjectTitle = z.string().trim().min(1, "Give the project a name").max(80, "Keep the name under 80 characters");
export const ProjectDescription = z.string().trim().max(500, "Keep the description under 500 characters");

export const CaptionParams = z.object({
  language: z.enum(["auto", "en", "hi", "hinglish"]),
  lengthMode: z.enum(["short", "standard"]),
});
export const EnhanceParams = z.object({
  noiseReduction: z.number().int().min(0).max(100),
  clarity: z.number().int().min(0).max(100),
  loudness: z.enum(["off", "podcast", "video"]),
});
export const SilenceParams = z.object({
  thresholdDb: z.number().int().min(-70).max(-20),
  minSilenceMs: z.number().int().min(150).max(5000),
  paddingMs: z.number().int().min(0).max(1000),
});
export type CaptionParamsT = z.infer<typeof CaptionParams>;
export type EnhanceParamsT = z.infer<typeof EnhanceParams>;
export type SilenceParamsT = z.infer<typeof SilenceParams>;

export const JobRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("transcribe"), params: CaptionParams }),
  z.object({ type: z.literal("enhance"), params: EnhanceParams }),
  z.object({ type: z.literal("silence_cut"), params: SilenceParams }),
]);
export type JobRequestT = z.infer<typeof JobRequest>;
export type JobType = JobRequestT["type"];

export const DEFAULT_ENHANCE: EnhanceParamsT = { noiseReduction: 60, clarity: 40, loudness: "podcast" };
export const DEFAULT_SILENCE: SilenceParamsT = { thresholdDb: -42, minSilenceMs: 600, paddingMs: 120 };
export const DEFAULT_CAPTIONS: CaptionParamsT = { language: "auto", lengthMode: "standard" };

export function fileExt(filename: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  return m?.[1] ?? "";
}

/** Strip path parts and unsafe characters from a user-supplied filename. */
export function safeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ()]+/g, "_").replace(/^\.+/, "").slice(0, 120);
  return cleaned || "file";
}

export function checkMedia(m: { filename: string; mimeType: string; sizeBytes: number; durationMs: number }): ErrorCode | null {
  const ext = fileExt(m.filename);
  if (!(CONFIG.acceptedExtensions as readonly string[]).includes(ext)) return "UNSUPPORTED_FORMAT";
  if (m.mimeType && !(CONFIG.acceptedMime as readonly string[]).includes(m.mimeType)) return "UNSUPPORTED_FORMAT";
  if (!(m.sizeBytes > 0)) return "UNSUPPORTED_FORMAT";
  if (m.sizeBytes > CONFIG.maxFileBytes) return "FILE_TOO_LARGE";
  if (!(m.durationMs > 0)) return "NO_AUDIO_TRACK";
  if (m.durationMs > CONFIG.maxDurationMs) return "TOO_LONG";
  return null;
}

/** Output objects must live under the caller's own job folder. */
export function isValidOutputPath(path: string, userId: string, projectId: string, jobId: string): boolean {
  const prefix = `${userId}/${projectId}/outputs/${jobId}/`;
  return path.startsWith(prefix) && /^[\w.-]{1,80}$/.test(path.slice(prefix.length));
}

export const JOB_LABEL: Record<string, string> = {
  transcribe: "Captions",
  enhance: "Voice cleanup",
  silence_cut: "Silence cut",
};

/** DB job status -> user-facing status. */
export function jobStatusLabel(s: string): "Queued" | "Processing" | "Completed" | "Failed" | "Cancelled" {
  if (s === "queued") return "Queued";
  if (s === "running") return "Processing";
  if (s === "succeeded") return "Completed";
  if (s === "canceled") return "Cancelled";
  return "Failed";
}
