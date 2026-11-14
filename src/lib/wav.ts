import { type ClickPlan } from './metronome';

export function encodeWavPcm16(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Uint8Array(buffer);
}

function addTone(
  samples: Float32Array,
  sampleRate: number,
  startSample: number,
  frequency: number,
  amplitude: number,
  seconds: number,
  decay: number,
) {
  const length = Math.round(seconds * sampleRate);
  for (let i = 0; i < length; i++) {
    const index = startSample + i;
    if (index < 0 || index >= samples.length) continue;
    const time = i / sampleRate;
    samples[index] = (samples[index] ?? 0) + Math.sin(2 * Math.PI * frequency * time) * amplitude * Math.exp(-decay * time);
  }
}

/** A seamless click loop. Length is an exact number of beats, so it does not drift. */
export function renderClickWav(plan: ClickPlan, sampleRate = 44100): Uint8Array {
  const count = Math.max(1, Math.round(plan.duration * sampleRate));
  const samples = new Float32Array(count);
  for (const click of plan.clicks) {
    const main = click.sub === 0;
    addTone(
      samples,
      sampleRate,
      Math.round(click.time * sampleRate),
      main ? (click.accent ? 1760 : 1175) : 880,
      main ? (click.accent ? 0.82 : 0.48) : 0.2,
      main ? 0.034 : 0.018,
      main ? 68 : 120,
    );
  }
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.max(-1, Math.min(1, samples[i] ?? 0));
  }
  return encodeWavPcm16(samples, sampleRate);
}

/**
 * A seamless drone. The buffer holds an integer number of fundamental cycles,
 * and the fifth (3/2) lands on a cycle boundary when the cycle count is even.
 */
export function renderDroneWav(frequency: number, withFifth: boolean, sampleRate = 44100): Uint8Array {
  const safeFrequency = Math.min(2000, Math.max(40, frequency));
  const cycles = 32;
  const count = Math.max(1, Math.round((cycles * sampleRate) / safeFrequency));
  const actual = (cycles * sampleRate) / count;
  const samples = new Float32Array(count);
  const gain = withFifth ? 0.34 : 0.42;
  for (let i = 0; i < count; i++) {
    const time = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * actual * time);
    sample += 0.16 * Math.sin(2 * Math.PI * actual * 2 * time);
    sample += 0.05 * Math.sin(2 * Math.PI * actual * 3 * time);
    if (withFifth) sample += 0.3 * Math.sin(2 * Math.PI * actual * 1.5 * time);
    samples[i] = sample * gain;
  }
  return encodeWavPcm16(samples, sampleRate);
}
