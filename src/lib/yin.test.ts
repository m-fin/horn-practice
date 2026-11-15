import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectPitchYin, rms } from './yin.ts';

function sine(frequency: number, sampleRate: number, seconds: number): Float32Array {
  const count = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.6;
  }
  return samples;
}

describe('YIN pitch detection', () => {
  const rate = 44100;

  it('finds A4, Bb4, and Bb3', () => {
    for (const frequency of [440, 466.16, 233.08, 880]) {
      const hit = detectPitchYin(sine(frequency, rate, 0.25), rate);
      assert.ok(hit, `no pitch for ${frequency}`);
      assert.ok(Math.abs(hit.frequency - frequency) < 1.5, `${hit.frequency} vs ${frequency}`);
    }
  });

  it('rejects silence', () => {
    const quiet = new Float32Array(4096);
    assert.equal(rms(quiet), 0);
    assert.equal(detectPitchYin(quiet, rate), null);
  });
});
