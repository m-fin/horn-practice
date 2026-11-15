export type PitchHit = {
  frequency: number;
  probability: number;
};

export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * YIN pitch detector (de Cheveigné & Kawahara).
 * Returns null when the buffer is too short or the signal is unpitched.
 */
export function detectPitchYin(
  samples: Float32Array,
  sampleRate: number,
  options?: { threshold?: number; minFreq?: number; maxFreq?: number },
): PitchHit | null {
  const threshold = options?.threshold ?? 0.15;
  const minFreq = options?.minFreq ?? 70;
  const maxFreq = options?.maxFreq ?? 1600;
  const length = samples.length;
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFreq));
  const tauMax = Math.min(Math.floor(sampleRate / minFreq), Math.floor(length / 2) - 1);
  if (tauMax <= tauMin + 2) return null;

  const window = length - tauMax;
  const diff = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = (samples[i] ?? 0) - (samples[i + tau] ?? 0);
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += diff[tau] ?? 0;
    cmnd[tau] = running === 0 ? 1 : ((diff[tau] ?? 0) * tau) / running;
  }

  let tau = tauMin;
  while (tau <= tauMax && (cmnd[tau] ?? 1) > threshold) tau++;
  if (tau > tauMax) {
    let best = tauMin;
    for (let cursor = tauMin + 1; cursor <= tauMax; cursor++) {
      if ((cmnd[cursor] ?? 1) < (cmnd[best] ?? 1)) best = cursor;
    }
    if ((cmnd[best] ?? 1) > 0.45) return null;
    tau = best;
  } else {
    while (tau + 1 <= tauMax && (cmnd[tau + 1] ?? 1) < (cmnd[tau] ?? 1)) tau++;
  }

  const x0 = Math.max(tauMin, tau - 1);
  const x2 = Math.min(tauMax, tau + 1);
  const s0 = cmnd[x0] ?? 1;
  const s1 = cmnd[tau] ?? 1;
  const s2 = cmnd[x2] ?? 1;
  const denominator = 2 * s1 - s2 - s0;
  const better = denominator === 0 ? tau : tau + (s2 - s0) / (2 * denominator);
  const frequency = sampleRate / better;
  if (!Number.isFinite(frequency) || frequency < minFreq || frequency > maxFreq) return null;
  return { frequency, probability: Math.max(0, 1 - s1) };
}
