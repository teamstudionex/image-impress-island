// Server-only job helpers. Imported dynamically from *.functions.ts handlers.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CONFIG } from "./config";
import { fail, ok, MESSAGES } from "./result";
import type { JobRequestT } from "./validation";

export const admin = supabaseAdmin;
export const STALE_MS = 10 * 60 * 1000;
type UserClient = SupabaseClient<Database>;

/** Structured log line. Never pass tokens, passwords or media content. */
export function log(evt: string, data: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ evt, at: new Date().toISOString(), ...data }));
}

export function periodStart(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function usedSeconds(userId: string) {
  const { data } = await admin.from("usage_ledger").select("seconds").eq("user_id", userId).eq("period_start", periodStart());
  return (data ?? []).reduce((s, r) => s + r.seconds, 0);
}

export async function logEvent(e: { user_id: string | null; name: string; tool?: string; outcome?: string; duration_ms?: number; error_code?: string }) {
  try {
    await admin.from("events").insert(e);
  } catch (err) {
    console.error("event log failed", err);
  }
}

/** Jobs whose browser worker stopped reporting are marked failed so the UI never sticks on "processing". */
export async function sweepStale(userId: string) {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data } = await admin
    .from("jobs")
    .update({ status: "failed", error_code: "INTERRUPTED", error_message: MESSAGES.INTERRUPTED, finished_at: new Date().toISOString() })
    .eq("user_id", userId).eq("status", "running").lt("updated_at", cutoff)
    .select("id");
  if (data?.length) log("job_interrupted", { userId, count: data.length });
}

export type StartedJob = {
  jobId: string;
  projectId: string;
  assetId: string;
  type: JobRequestT["type"];
  params: JobRequestT["params"];
  sourceUrl: string;
  filename: string;
  durationMs: number;
};

export async function startJob(
  supabase: UserClient,
  userId: string,
  input: { projectId: string; assetId: string; retryOf?: string } & JobRequestT,
) {
  const { data: asset } = await supabase
    .from("assets")
    .select("id, project_id, duration_ms, expires_at, upload_status, storage_path, filename")
    .eq("id", input.assetId).eq("project_id", input.projectId).maybeSingle();
  if (!asset || asset.upload_status !== "uploaded") return fail("FILE_NOT_FOUND");
  if (new Date(asset.expires_at) < new Date()) return fail("ASSET_EXPIRED");

  await sweepStale(userId);
  const { data: active } = await admin
    .from("jobs").select("id").eq("user_id", userId).eq("asset_id", asset.id).eq("type", input.type).eq("status", "running").limit(1);
  if (active?.length) return fail("JOB_IN_PROGRESS");

  const used = await usedSeconds(userId);
  if (used + Math.ceil(asset.duration_ms / 1000) > CONFIG.monthlyMinutes * 60) return fail("QUOTA_EXCEEDED");

  const { data: signed, error: signErr } = await supabase.storage.from("media").createSignedUrl(asset.storage_path, 3600);
  if (signErr || !signed) {
    log("source_missing", { userId, assetId: asset.id });
    return fail("SOURCE_MISSING");
  }

  const now = new Date().toISOString();
  const { data: job, error } = await admin.from("jobs").insert({
    user_id: userId, project_id: input.projectId, asset_id: asset.id, type: input.type,
    params: input.params as unknown as Json, status: "running", started_at: now, updated_at: now,
    retry_of: input.retryOf ?? null,
  }).select("id").single();
  if (error || !job) {
    log("db_error", { op: "job_insert", userId, message: error?.message });
    return fail("DATABASE_ERROR");
  }
  const toolName = input.type === "transcribe" ? "captions" : input.type === "enhance" ? "voice-enhancer" : "silence-cutter";
  await admin.from("projects").update({ last_tool: toolName, updated_at: now }).eq("id", input.projectId).eq("user_id", userId);
  await logEvent({ user_id: userId, name: "job_created", tool: toolName });
  log("job_started", { userId, jobId: job.id, type: input.type, retryOf: input.retryOf ?? null });
  const started: StartedJob = {
    jobId: job.id, projectId: input.projectId, assetId: asset.id, type: input.type, params: input.params,
    sourceUrl: signed.signedUrl, filename: asset.filename, durationMs: asset.duration_ms,
  };
  return ok(started);
}

/** Load a job the caller owns that is still running. */
export async function runningJob(jobId: string, userId: string) {
  const { data: job } = await admin.from("jobs").select("*").eq("id", jobId).eq("user_id", userId).maybeSingle();
  if (!job || job.status !== "running") return null;
  return job;
}

export async function chargeUsage(userId: string, jobId: string, assetId: string | null) {
  if (!assetId) return;
  const { data: asset } = await admin.from("assets").select("duration_ms").eq("id", assetId).maybeSingle();
  await admin.from("usage_ledger").upsert(
    { user_id: userId, job_id: jobId, seconds: Math.ceil((asset?.duration_ms ?? 0) / 1000), period_start: periodStart() },
    { onConflict: "job_id", ignoreDuplicates: true },
  );
}
