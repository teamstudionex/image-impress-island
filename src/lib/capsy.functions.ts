import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONFIG, INTENTS } from "./config";

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

function periodStart(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

async function logEvent(e: { user_id: string | null; name: string; tool?: string; outcome?: string; duration_ms?: number; error_code?: string }) {
  try {
    const a = await admin();
    await a.from("events").insert(e);
  } catch (err) {
    console.error("event log failed", err);
  }
}

async function usedSeconds(userId: string) {
  const a = await admin();
  const { data } = await a.from("usage_ledger").select("seconds").eq("user_id", userId).eq("period_start", periodStart());
  return (data ?? []).reduce((s, r) => s + r.seconds, 0);
}

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ intent: z.enum(INTENTS).optional(), termsAccepted: z.boolean().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    const now = new Date().toISOString();
    if (existing) {
      await supabase.from("profiles").update({ last_sign_in_at: now }).eq("user_id", userId);
      return existing;
    }
    const row = {
      user_id: userId,
      first_intent: data.intent ?? null,
      terms_accepted_at: data.termsAccepted !== false ? now : null,
      terms_version: CONFIG.termsVersion,
      last_sign_in_at: now,
    };
    const { data: created, error } = await supabase.from("profiles").insert(row).select().single();
    if (error) throw new Error("PROCESSING_FAILED");
    await logEvent({ user_id: userId, name: "sign_up" });
    await logEvent({ user_id: userId, name: "email_verified" });
    return created;
  });

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const used = await usedSeconds(context.userId);
    const now = new Date();
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
    return { usedSeconds: used, limitMinutes: CONFIG.monthlyMinutes, resetsAt: reset };
  });

export const recordProjectCreated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await logEvent({ user_id: context.userId, name: "project_created", tool: "captions" });
    return { ok: true };
  });

export const recordExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ format: z.enum(["srt", "vtt", "txt"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await logEvent({ user_id: context.userId, name: "export_downloaded", tool: "captions", outcome: data.format });
    return { ok: true };
  });

const LangSchema = z.enum(["auto", "en", "hi", "hinglish"]);

export const startTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ projectId: z.string().uuid(), assetId: z.string().uuid(), language: LangSchema, lengthMode: z.enum(["short", "standard"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: asset } = await supabase
      .from("assets").select("id, duration_ms, project_id, expires_at")
      .eq("id", data.assetId).eq("project_id", data.projectId).maybeSingle();
    if (!asset) return { error: "NOT_FOUND" as const };
    if (new Date(asset.expires_at) < new Date()) return { error: "ASSET_EXPIRED" as const };
    const used = await usedSeconds(userId);
    if (used + Math.ceil(asset.duration_ms / 1000) > CONFIG.monthlyMinutes * 60) return { error: "QUOTA_EXCEEDED" as const };
    const a = await admin();
    const { data: job, error } = await a.from("jobs").insert({
      user_id: userId, project_id: data.projectId, asset_id: data.assetId, type: "transcribe",
      params: { language: data.language, lengthMode: data.lengthMode }, status: "running",
    }).select("id").single();
    if (error || !job) return { error: "PROCESSING_FAILED" as const };
    await a.from("projects").update({ last_tool: "captions", updated_at: new Date().toISOString() }).eq("id", data.projectId);
    await logEvent({ user_id: userId, name: "job_created", tool: "captions" });
    return { jobId: job.id };
  });

async function requireRunningJob(jobId: string, userId: string) {
  const a = await admin();
  const { data: job } = await a.from("jobs").select("*").eq("id", jobId).eq("user_id", userId).maybeSingle();
  if (!job || job.status !== "running") throw new Error("NOT_FOUND");
  if (Date.now() - new Date(job.created_at).getTime() > 2 * 3600 * 1000) throw new Error("NOT_FOUND");
  return job;
}

export const transcribeChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ jobId: z.string().uuid(), wav: z.string().max(1_200_000), language: LangSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireRunningJob(data.jobId, context.userId);
    const { transcribeWav, ProviderError } = await import("./ai.server");
    const lang = data.language === "auto" ? undefined : data.language === "hinglish" ? "hi" : data.language;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return { text: await transcribeWav(data.wav, lang) };
      } catch (e) {
        if (e instanceof ProviderError && e.code === "PROVIDER_UNAVAILABLE" && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1) + Math.random() * 500));
          continue;
        }
        return { error: e instanceof ProviderError ? e.code : "PROCESSING_FAILED" };
      }
    }
    return { error: "PROVIDER_UNAVAILABLE" };
  });

export const hinglishify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid(), lines: z.array(z.string().max(2000)).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireRunningJob(data.jobId, context.userId);
    const { toHinglish, ProviderError } = await import("./ai.server");
    try {
      return { lines: await toHinglish(data.lines) };
    } catch (e) {
      return { error: e instanceof ProviderError ? e.code : "PROCESSING_FAILED" };
    }
  });

const WordSchema = z.object({ text: z.string(), start: z.number().int(), end: z.number().int() });
const SegSchema = z.object({ id: z.string(), start: z.number().int(), end: z.number().int(), text: z.string().max(2000) });

export const finishTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      jobId: z.string().uuid(),
      outcome: z.enum(["succeeded", "failed", "canceled"]),
      errorCode: z.string().max(40).optional(),
      words: z.array(WordSchema).max(50000).optional(),
      segments: z.array(SegSchema).max(10000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const job = await requireRunningJob(data.jobId, context.userId);
    const a = await admin();
    const finished = new Date().toISOString();
    const elapsed = Date.now() - new Date(job.created_at).getTime();
    if (data.outcome !== "succeeded") {
      await a.from("jobs").update({ status: data.outcome, error_code: data.errorCode ?? null, finished_at: finished, duration_ms: elapsed }).eq("id", job.id);
      if (data.outcome === "failed") await logEvent({ user_id: context.userId, name: "job_failed", tool: "captions", ...(data.errorCode ? { error_code: data.errorCode } : {}) });
      return { ok: true };
    }
    const params = job.params as { language: string; lengthMode: string };
    const { data: existing } = await a.from("caption_docs").select("revision").eq("project_id", job.project_id).maybeSingle();
    const { error } = await a.from("caption_docs").upsert({
      project_id: job.project_id, user_id: context.userId, asset_id: job.asset_id,
      language: params.language, length_mode: params.lengthMode,
      words: data.words ?? [], segments: data.segments ?? [],
      revision: (existing?.revision ?? 0) + 1, updated_at: finished,
    });
    if (error) {
      console.error(error);
      return { error: "PROCESSING_FAILED" };
    }
    await a.from("jobs").update({ status: "succeeded", finished_at: finished, duration_ms: elapsed }).eq("id", job.id);
    const { data: asset } = await a.from("assets").select("duration_ms").eq("id", job.asset_id!).maybeSingle();
    await a.from("usage_ledger").insert({
      user_id: context.userId, job_id: job.id, seconds: Math.ceil((asset?.duration_ms ?? 0) / 1000), period_start: periodStart(),
    });
    await a.from("projects").update({ updated_at: finished }).eq("id", job.project_id);
    await logEvent({ user_id: context.userId, name: "job_succeeded", tool: "captions", duration_ms: elapsed });
    return { ok: true };
  });

export const saveCaptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      baseRevision: z.number().int(),
      force: z.boolean().optional(),
      lengthMode: z.enum(["short", "standard"]),
      segments: z.array(SegSchema).max(10000),
      style: z.record(z.any()).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase.from("caption_docs").select("revision").eq("project_id", data.projectId).maybeSingle();
    if (!doc) return { error: "NOT_FOUND" as const };
    if (!data.force && doc.revision !== data.baseRevision) return { conflict: true as const, revision: doc.revision };
    const a = await admin();
    const rev = doc.revision + 1;
    const now = new Date().toISOString();
    await a.from("caption_docs").update({ segments: data.segments, length_mode: data.lengthMode, style: data.style ?? null, revision: rev, updated_at: now })
      .eq("project_id", data.projectId).eq("user_id", context.userId);
    await a.from("projects").update({ updated_at: now }).eq("id", data.projectId).eq("user_id", context.userId);
    return { revision: rev };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: proj } = await supabase.from("projects").select("id").eq("id", data.projectId).maybeSingle();
    if (!proj) return { error: "NOT_FOUND" };
    await supabase.from("projects").update({ status: "deleting" }).eq("id", data.projectId);
    const { data: assets } = await supabase.from("assets").select("storage_path").eq("project_id", data.projectId);
    const paths = (assets ?? []).map((x) => x.storage_path);
    if (paths.length) {
      const { error } = await supabase.storage.from("media").remove(paths);
      if (error) console.error("storage remove failed", error);
    }
    const { error } = await supabase.from("projects").delete().eq("id", data.projectId).eq("user_id", userId);
    if (error) return { error: "PROCESSING_FAILED" };
    return { ok: true, removedObjects: paths.length };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(d))
  .handler(async ({ context }) => {
    const { userId } = context;
    const a = await admin();
    // storage objects
    const { data: files } = await a.storage.from("media").list(userId, { limit: 1000 });
    for (const folder of files ?? []) {
      const { data: inner } = await a.storage.from("media").list(`${userId}/${folder.name}`, { limit: 1000 });
      const paths = (inner ?? []).map((f) => `${userId}/${folder.name}/${f.name}`);
      if (paths.length) await a.storage.from("media").remove(paths);
    }
    await a.from("projects").delete().eq("user_id", userId);
    await a.from("jobs").delete().eq("user_id", userId);
    await a.from("usage_ledger").delete().eq("user_id", userId);
    await a.from("preferences").delete().eq("user_id", userId);
    await a.from("profiles").delete().eq("user_id", userId);
    await a.from("events").update({ user_id: null }).eq("user_id", userId);
    await logEvent({ user_id: null, name: "account_deleted" });
    const { error } = await a.auth.admin.deleteUser(userId);
    if (error) {
      console.error(error);
      return { error: "PROCESSING_FAILED" };
    }
    return { ok: true };
  });
