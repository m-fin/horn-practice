import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildExercise, formatSpelled, majorScale } from './exercises.ts';

describe('generated exercises', () => {
  it('spells common major scales in written pitch', () => {
    assert.deepEqual(majorScale('Bb').map(formatSpelled), ['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5', 'Bb5']);
    assert.deepEqual(majorScale('G').map(formatSpelled), ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5']);
    assert.deepEqual(majorScale('Ab').map(formatSpelled), ['Ab4', 'Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5']);
  });

  it('builds long tones as whole notes and a scale that comes back down', () => {
    const tones = buildExercise('long-tones', 'C');
    assert.equal(tones.notes.length, 8);
    assert.ok(tones.notes.every((note) => note.quarters === 4));
    const scale = buildExercise('major-scale', 'F');
    assert.equal(scale.notes.length, 15);
    assert.equal(formatSpelled(scale.notes[0]!), 'F4');
    assert.equal(formatSpelled(scale.notes[7]!), 'F5');
    assert.equal(formatSpelled(scale.notes[8]!), 'E5');
  });
});
