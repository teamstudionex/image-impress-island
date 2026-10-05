// Browser-only audio helpers: decode media, find speech chunks, encode WAV.
export type Probe = { durationMs: number; hasVideo: boolean; width?: number; height?: number };

export function probeMedia(file: File): Promise<Probe> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    const el = document.createElement(isVideo ? "video" : "audio") as HTMLVideoElement;
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const r: Probe = {
        durationMs: Math.round(el.duration * 1000),
        hasVideo: isVideo && el.videoWidth > 0,
        width: isVideo ? el.videoWidth || undefined : undefined,
        height: isVideo ? el.videoHeight || undefined : undefined,
      };
      URL.revokeObjectURL(url);
      resolve(r);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("UNSUPPORTED_FORMAT"));
    };
    el.src = url;
  });
}

const RATE = 16000;

export async function decodeToMono(file: Blob): Promise<Float32Array> {
  const buf = await file.arrayBuffer();
  const ctx = new OfflineAudioContext(1, 1, RATE);
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(buf);
  } catch {
    throw new Error("NO_AUDIO_TRACK");
  }
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * RATE), RATE);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0);
}

export type Chunk = { start: number; end: number }; // ms

/** Split audio into speech chunks (max ~12 s), cutting at the quietest points. */
export function findChunks(samples: Float32Array, maxMs = 12000, minMs = 3000): Chunk[] {
  const frame = RATE / 50; // 20 ms frames
  const n = Math.floor(samples.length / frame);
  const rms = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < frame; j++) {
      const v = samples[i * frame + j];
      s += v * v;
    }
    rms[i] = Math.sqrt(s / frame);
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const floor = sorted[Math.floor(n * 0.1)] ?? 0;
  const peak = sorted[Math.floor(n * 0.95)] ?? 0;
  const thr = floor + (peak - floor) * 0.15;
  const chunks: Chunk[] = [];
  const maxF = maxMs / 20, minF = minMs / 20;
  let i = 0;
  while (i < n) {
    while (i < n && rms[i] < thr) i++; // skip leading silence
    if (i >= n) break;
    const start = Math.max(0, i - 10);
    let end = Math.min(n, start + maxF);
    if (end < n) {
      let best = end, bestV = Infinity;
      for (let k = start + minF; k < end; k++) if (rms[k] < bestV) { bestV = rms[k]; best = k; }
      end = best;
    }
    chunks.push({ start: start * 20, end: end * 20 });
    i = end;
  }
  return chunks;
}

export function hasSpeech(samples: Float32Array) {
  let max = 0;
  for (let i = 0; i < samples.length; i += 32) max = Math.max(max, Math.abs(samples[i]));
  return max > 0.01;
}

export function wavBase64(samples: Float32Array, startMs: number, endMs: number): string {
  const a = Math.floor((startMs / 1000) * RATE);
  const b = Math.min(samples.length, Math.floor((endMs / 1000) * RATE));
  const len = b - a;
  const buf = new ArrayBuffer(44 + len * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + len * 2, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, samples[a + i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Peaks for a waveform drawing (0..1). */
export function peaks(samples: Float32Array, count: number): number[] {
  const step = Math.max(1, Math.floor(samples.length / count));
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    let m = 0;
    for (let j = i * step; j < (i + 1) * step && j < samples.length; j += 8) m = Math.max(m, Math.abs(samples[j]));
    out.push(m);
  }
  const mx = Math.max(0.01, ...out);
  return out.map((x) => x / mx);
}
