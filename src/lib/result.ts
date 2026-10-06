// Shared response envelope + error vocabulary used by every server function and the UI.
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "PROJECT_NOT_FOUND"
  | "FILE_NOT_FOUND"
  | "OUTPUT_NOT_FOUND"
  | "JOB_NOT_FOUND"
  | "SOURCE_MISSING"
  | "OUTPUT_MISSING"
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "TOO_LONG"
  | "NO_AUDIO_TRACK"
  | "ASSET_EXPIRED"
  | "QUOTA_EXCEEDED"
  | "JOB_IN_PROGRESS"
  | "JOB_NOT_RETRYABLE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_UNAVAILABLE"
  | "PROCESSING_FAILED"
  | "UPLOAD_FAILED"
  | "STORAGE_FAILED"
  | "DATABASE_ERROR"
  | "INTERRUPTED"
  | "CANCELED"
  | "CONFLICT"
  | "DEV_ONLY";

export const MESSAGES: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  INVALID_INPUT: "Some of the details you entered aren't valid.",
  PROJECT_NOT_FOUND: "This project doesn't exist or was deleted.",
  FILE_NOT_FOUND: "This file doesn't exist or was deleted.",
  OUTPUT_NOT_FOUND: "This output doesn't exist or was deleted.",
  JOB_NOT_FOUND: "This processing job doesn't exist.",
  SOURCE_MISSING: "The original file is no longer stored. Upload it again.",
  OUTPUT_MISSING: "The output file is no longer stored. Run the tool again.",
  UNSUPPORTED_FORMAT: "This file type isn't supported. Use MP4, MOV, WEBM, MP3, WAV or M4A.",
  FILE_TOO_LARGE: "This file is larger than the 500 MB limit.",
  TOO_LONG: "This file is longer than the 30 minute limit.",
  NO_AUDIO_TRACK: "We couldn't find any audio in this file.",
  ASSET_EXPIRED: "This file has passed its storage period. Upload it again.",
  QUOTA_EXCEEDED: "You've used this month's processing minutes.",
  JOB_IN_PROGRESS: "This file is already being processed with this tool.",
  JOB_NOT_RETRYABLE: "Only failed or cancelled jobs can be retried.",
  PROVIDER_NOT_CONFIGURED: "This processing provider is not configured yet.",
  PROVIDER_UNAVAILABLE: "The processing service is busy. Please retry in a minute.",
  PROCESSING_FAILED: "Processing failed. Please retry.",
  UPLOAD_FAILED: "The upload failed. Check your connection and try again.",
  STORAGE_FAILED: "We couldn't reach file storage. Please try again.",
  DATABASE_ERROR: "We couldn't save that change. Please try again.",
  INTERRUPTED: "Processing stopped before finishing (the tab may have closed). Retry to run it again.",
  CANCELED: "Processing was cancelled.",
  CONFLICT: "These captions were changed elsewhere.",
  DEV_ONLY: "This action is only available in development mode.",
};

export type ApiError = { code: ErrorCode; message: string };
export type ApiResult<T> = { success: true; data: T } | { success: false; error: ApiError };

export const ok = <T>(data: T): { success: true; data: T } => ({ success: true, data });
export const fail = (code: ErrorCode, message?: string): { success: false; error: ApiError } => ({
  success: false,
  error: { code, message: message ?? MESSAGES[code] },
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
  if (e instanceof Error && /unauthor|401/i.test(e.message)) return "UNAUTHENTICATED";
  return "PROCESSING_FAILED";
}

export function errorMessage(e: unknown): string {
  if (e instanceof AppError) return e.message;
  return MESSAGES[errorCode(e)];
}
