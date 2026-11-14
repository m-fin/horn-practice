import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  analyzePitch,
  frequencyToMidi,
  midiToFrequency,
  writtenFrequency,
} from './pitch.ts';

describe('pitch transposition', () => {
  it('round-trips A4', () => {
    assert.ok(Math.abs(midiToFrequency(69) - 440) < 0.001);
    assert.ok(Math.abs(frequencyToMidi(440) - 69) < 0.001);
  });

  it('shows concert Bb as written C on trumpet and written G on alto', () => {
    const concertBb4 = midiToFrequency(70);
    const trumpet = analyzePitch(concertBb4, 'bb-trumpet');
    const alto = analyzePitch(concertBb4, 'eb-alto');
    assert.equal(trumpet.written.name, 'C');
    assert.equal(trumpet.written.octave, 5);
    assert.ok(Math.abs(trumpet.written.cents) < 0.2);
    assert.equal(alto.written.name, 'G');
    assert.equal(alto.written.octave, 5);
    assert.equal(trumpet.concert.name, 'Bb');
    assert.equal(trumpet.inTune, true);
  });

  it('reports cents sharp of the nearest written note', () => {
    const sharpA = 440 * 2 ** (10 / 1200);
    const reading = analyzePitch(sharpA, 'bb-trumpet');
    assert.equal(reading.concert.name, 'A');
    assert.ok(reading.written.cents > 8 && reading.written.cents < 12);
    assert.equal(reading.inTune, false);
  });

  it('sounds a written tuning note at the right concert pitch', () => {
    const trumpetC = writtenFrequency('C', 5, 'bb-trumpet');
    const altoG = writtenFrequency('G', 5, 'eb-alto');
    assert.ok(Math.abs(trumpetC - midiToFrequency(70)) < 0.01);
    assert.ok(Math.abs(altoG - midiToFrequency(70)) < 0.01);
    const altoFSharp = writtenFrequency('F#', 5, 'eb-alto');
    assert.ok(Math.abs(altoFSharp - 440) < 0.01);
  });
});
