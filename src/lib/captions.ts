// Pure caption utilities shared by the editor, exporters and tests.
export type Word = { text: string; start: number; end: number };
export type Segment = { id: string; start: number; end: number; text: string };
export type LengthMode = "short" | "standard";

let idSeq = 0;
export const newId = () => `s${Date.now().toString(36)}${(idSeq++).toString(36)}`;

const SENTENCE_END = /[.!?।]$/;

export function graphemes(s: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    let n = 0;
    for (const _ of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)) n++;
    return n;
  }
  return [...s].length;
}

export function lineLimit(mode: LengthMode) {
  return mode === "short" ? 26 : 42;
}

/** Break a string into at most 2 balanced lines at a space near the midpoint. */
export function balanceLines(text: string, limit: number): string {
  if (graphemes(text) <= limit) return text;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  if (best === -1) return text;
  return `${text.slice(0, best)}\n${text.slice(best + 1)}`;
}

export function segmentWords(words: Word[], mode: LengthMode): Segment[] {
  const segs: Segment[] = [];
  let cur: Word[] = [];
  const maxWords = mode === "short" ? 4 : Infinity;
  const pauseBreak = mode === "short" ? 350 : 700;
  const maxChars = mode === "short" ? 26 : 84;
  const maxDur = mode === "short" ? 2500 : 6000;

  const flush = () => {
    if (!cur.length) return;
    const text = cur.map((w) => w.text).join(" ");
    segs.push({
      id: newId(),
      start: cur[0].start,
      end: cur[cur.length - 1].end + 100,
      text: mode === "standard" ? balanceLines(text, 42) : text,
    });
    cur = [];
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (cur.length) {
      const prev = cur[cur.length - 1];
      const nextText = cur.map((x) => x.text).join(" ") + " " + w.text;
      if (
        w.start - prev.end > pauseBreak ||
        cur.length >= maxWords ||
        graphemes(nextText) > maxChars ||
        w.end - cur[0].start > maxDur
      ) flush();
    }
    cur.push(w);
    if (SENTENCE_END.test(w.text) && (mode === "short" || w.end - cur[0].start > 1000)) flush();
  }
  flush();
  // never overlap the next segment
  for (let i = 0; i < segs.length - 1; i++) {
    if (segs[i].end > segs[i + 1].start) segs[i].end = Math.max(segs[i].start + 200, segs[i + 1].start);
  }
  return segs;
}

/** Spread words across a chunk of audio proportionally to their length. */
export function wordsFromChunk(text: string, start: number, end: number): Word[] {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return [];
  const weights = parts.map((p) => graphemes(p) + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = end - start;
  let t = start;
  return parts.map((p, i) => {
    const d = (weights[i] / total) * span;
    const w = { text: p, start: Math.round(t), end: Math.round(t + d) };
    t += d;
    return w;
  });
}

// ---- time ----
export function fmtTime(ms: number, sep = ".") {
  ms = Math.max(0, Math.round(ms));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(r, 3)}`;
}

export function fmtShort(ms: number) {
  ms = Math.max(0, Math.round(ms));
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}

/** Accepts m:ss.mmm or ss.mmm. Returns null when invalid. */
export function parseTime(v: string): number | null {
  const m = v.trim().match(/^(?:(\d+):)?(\d{1,2}(?:\.\d{1,3})?)$/);
  if (!m) return null;
  const mins = m[1] ? parseInt(m[1], 10) : 0;
  const secs = parseFloat(m[2]);
  if (m[1] && secs >= 60) return null;
  return Math.round(mins * 60000 + secs * 1000);
}

// ---- export ----
export function toSRT(segs: Segment[]) {
  return segs.map((s, i) => `${i + 1}\n${fmtTime(s.start, ",")} --> ${fmtTime(s.end, ",")}\n${s.text}\n`).join("\n");
}
export function toVTT(segs: Segment[]) {
  return "WEBVTT\n\n" + segs.map((s) => `${fmtTime(s.start)} --> ${fmtTime(s.end)}\n${s.text}\n`).join("\n");
}
export function toTXT(segs: Segment[]) {
  return segs.map((s) => s.text.replace(/\n/g, " ")).join("\n") + "\n";
}

// ---- validation ----
export type Issue = { segId: string; index: number; level: "error" | "warning"; message: string; fix?: "trim-overlap" };

export function validate(segs: Segment[], mode: LengthMode, durationMs?: number): Issue[] {
  const out: Issue[] = [];
  const limit = lineLimit(mode);
  segs.forEach((s, i) => {
    const push = (level: Issue["level"], message: string, fix?: Issue["fix"]) => out.push({ segId: s.id, index: i, level, message, fix });
    if (!s.text.trim()) push("error", "Caption is empty");
    if (s.end <= s.start) push("error", "End is before start");
    else if (s.end - s.start < 300) push("warning", "Shorter than 0.3 s");
    else if (s.end - s.start > 7000) push("warning", "Longer than 7 s");
    if (durationMs && s.end > durationMs + 50) push("warning", "Ends after the media");
    const lines = s.text.split("\n");
    if (lines.length > 2) push("warning", "More than 2 lines");
    if (lines.some((l) => graphemes(l) > limit)) push("warning", `Line longer than ${limit} characters`);
    const secs = (s.end - s.start) / 1000;
    if (secs > 0 && graphemes(s.text.replace(/\n/g, "")) / secs > 20) push("warning", "Reading speed over 20 characters per second");
    const next = segs[i + 1];
    if (next && s.end > next.start) push("warning", "Overlaps the next caption", "trim-overlap");
  });
  return out;
}
