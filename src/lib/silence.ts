// Pure speech-interval math for the Silence Cutter. All times in milliseconds.
export type TimedWord = { start: number; end: number; confidence?: number };
export type Range = { start: number; end: number };
export type SilenceOptions = { minSilenceMs: number; paddingMs: number; minConfidence: number };

/** Returns ordered, non-overlapping ranges to keep. Gaps shorter than minSilenceMs are kept. */
export function keepRanges(words: TimedWord[], durationMs: number, o: SilenceOptions): Range[] {
  const speech = words
    .filter((w) => (w.confidence ?? 1) >= o.minConfidence && w.end > w.start)
    .map((w) => ({ start: Math.max(0, w.start), end: Math.min(durationMs, w.end) }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);
  if (!speech.length) return [];

  // Merge speech separated by gaps shorter than the minimum silence.
  const merged: Range[] = [{ ...speech[0]! }];
  for (const r of speech.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (r.start - last.end < o.minSilenceMs) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }

  // Pad, clamp, then merge anything that now overlaps.
  const padded = merged.map((r) => ({
    start: Math.max(0, r.start - o.paddingMs),
    end: Math.min(durationMs, r.end + o.paddingMs),
  }));
  const out: Range[] = [];
  for (const r of padded) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out.filter((r) => r.end - r.start > 0);
}

export function keptDuration(ranges: Range[]) {
  return ranges.reduce((s, r) => s + (r.end - r.start), 0);
}
