// Shared response envelope + error vocabulary used by every server function and the UI.
export type ErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "PROJECT_NOT_FOUND"
  | "FILE_NOT_FOUND"
  | "OUTPUT_NOT_FOUND"
  | "JOB_NOT_FOUND"
  | "INVALID_FILE"
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "TOO_LONG"
  | "ASSET_EXPIRED"
  | "QUOTA_EXCEEDED"
  | "JOB_IN_PROGRESS"
  | "JOB_NOT_RETRYABLE"
  | "EMPTY_TRANSCRIPT"
  | "NO_SPEECH"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_INVALID_RESPONSE"
  | "PROVIDER_REJECTED_FILE"
  | "PROVIDER_UNAVAILABLE"
  | "PROCESSING_FAILED"
  | "STORAGE_FAILED"
  | "DATABASE_FAILED"
  | "INTERRUPTED"
  | "CONFLICT";

export const MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have access to this item.",
  INVALID_INPUT: "Some of the details you entered aren't valid.",
  PROJECT_NOT_FOUND: "This project doesn't exist or was deleted.",
  FILE_NOT_FOUND: "This file doesn't exist or was deleted.",
  OUTPUT_NOT_FOUND: "This output doesn't exist or was deleted.",
  JOB_NOT_FOUND: "This processing job doesn't exist.",
  INVALID_FILE: "This file is empty or unreadable.",
  UNSUPPORTED_FILE: "This file type isn't supported. Use MP4, MOV, WEBM, MP3, WAV, M4A or OGG.",
  FILE_TOO_LARGE: "This file is larger than the 500 MB limit.",
  TOO_LONG: "This file is longer than the 30 minute limit.",
  ASSET_EXPIRED: "This file has passed its storage period. Upload it again.",
  QUOTA_EXCEEDED: "You've used this month's processing minutes.",
  JOB_IN_PROGRESS: "This file is already being processed with this tool.",
  JOB_NOT_RETRYABLE: "Only failed jobs can be retried.",
  EMPTY_TRANSCRIPT: "No speech was found in this file.",
  NO_SPEECH: "No speech was found, so there is nothing to keep.",
  PROVIDER_NOT_CONFIGURED: "Provider not configured.",
  PROVIDER_AUTH_FAILED: "The processing service rejected our credentials. Please contact support.",
  PROVIDER_RATE_LIMIT: "This operation is temporarily unavailable. Please try again.",
  PROVIDER_TIMEOUT: "The processing service took too long. Please try again.",
  PROVIDER_INVALID_RESPONSE: "The processing service returned an unexpected result.",
  PROVIDER_REJECTED_FILE: "The processing service couldn't read this file.",
  PROVIDER_UNAVAILABLE: "The processing service is busy. Please retry in a minute.",
  PROCESSING_FAILED: "Processing failed. Please retry.",
  STORAGE_FAILED: "We couldn't reach file storage. Please try again.",
  DATABASE_FAILED: "We couldn't save that change. Please try again.",
  INTERRUPTED: "Processing stopped before finishing. Retry to run it again.",
  CONFLICT: "These captions were changed elsewhere.",
};

const RETRYABLE = new Set<ErrorCode>([
  "PROVIDER_RATE_LIMIT", "PROVIDER_TIMEOUT", "PROVIDER_UNAVAILABLE", "PROCESSING_FAILED",
  "STORAGE_FAILED", "DATABASE_FAILED", "INTERRUPTED", "PROVIDER_INVALID_RESPONSE",
]);

export type ApiError = { code: ErrorCode; message: string; retryable: boolean };
export type ApiResult<T> = { success: true; data: T } | { success: false; error: ApiError };

export const ok = <T>(data: T): { success: true; data: T } => ({ success: true, data });
export const fail = (code: ErrorCode, message?: string): { success: false; error: ApiError } => ({
  success: false,
  error: { code, message: message ?? MESSAGES[code], retryable: RETRYABLE.has(code) },
});

export class AppError extends Error {
  constructor(public code: ErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
  }
}

export function isErrorCode(v: unknown): v is ErrorCode {
  return typeof v === "string" && v in MESSAGES;
}

export function unwrap<T>(r: ApiResult<T>): T {
  if (r.success) return r.data;
  throw new AppError(r.error.code, r.error.message);
}

export function errorCode(e: unknown): ErrorCode {
  if (e instanceof AppError) return e.code;
  if (e instanceof Error && isErrorCode(e.message)) return e.message;
  if (e instanceof Error && /unauthor|401/i.test(e.message)) return "AUTH_REQUIRED";
  return "PROCESSING_FAILED";
}

export function errorMessage(e: unknown): string {
  if (e instanceof AppError) return e.message;
  return MESSAGES[errorCode(e)];
}
