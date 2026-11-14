import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clampBpm, planClicks, tempoFromTaps } from './metronome.ts';
import { renderClickWav, renderDroneWav } from './wav.ts';

describe('metronome plan', () => {
  it('clamps tempo to 30–300', () => {
    assert.equal(clampBpm(10), 30);
    assert.equal(clampBpm(400), 300);
    assert.equal(clampBpm(96.4), 96);
  });

  it('turns half-second taps into 120', () => {
    const taps = [0, 500, 1000, 1500, 2000];
    assert.equal(tempoFromTaps(taps), 120);
  });

  it('places an accented click on each downbeat of two bars of 4/4', () => {
    const plan = planClicks({
      bpm: 120,
      beats: 4,
      subdivision: 1,
      accents: [true, false, false, false],
      bars: 2,
    });
    assert.equal(plan.duration, 4);
    assert.deepEqual(
      plan.clicks.map((click) => click.time),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
    );
    assert.deepEqual(
      plan.clicks.map((click) => click.accent),
      [true, false, false, false, true, false, false, false],
    );
  });

  it('adds quieter subdivisions between beats', () => {
    const plan = planClicks({
      bpm: 60,
      beats: 2,
      subdivision: 2,
      accents: [true, false],
      bars: 1,
    });
    assert.equal(plan.clicks.length, 4);
    assert.equal(plan.clicks[1]?.sub, 1);
    assert.equal(plan.clicks[1]?.accent, false);
    assert.equal(plan.duration, 2);
  });

  it('renders a wav whose clicks sit on the planned samples', () => {
    const plan = planClicks({
      bpm: 120,
      beats: 4,
      subdivision: 1,
      accents: [true, false, false, false],
      bars: 1,
    });
    const wav = renderClickWav(plan, 44100);
    assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
    const data = wav.subarray(44);
    const energy = (sample: number) => {
      let sum = 0;
      for (let i = sample; i < sample + 80; i++) {
        const lo = data[i * 2] ?? 0;
        const hi = data[i * 2 + 1] ?? 0;
        let value = lo | (hi << 8);
        if (value >= 0x8000) value -= 0x10000;
        sum += Math.abs(value);
      }
      return sum;
    };
    assert.ok(energy(0) > energy(2000));
    assert.ok(energy(22050) > energy(20000));
  });

  it('loops a drone on an integer number of cycles', () => {
    const wav = renderDroneWav(440, true, 44100);
    const samples = (wav.length - 44) / 2;
    const cycles = (samples * 440) / 44100;
    assert.ok(Math.abs(cycles - Math.round(cycles)) < 0.02);
  });
});
