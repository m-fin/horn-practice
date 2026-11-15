import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DRONE_NOTES } from './pitch.ts';
import { accidentalGlyph, buildExercise, formatSpelled, keySignature, majorScale, type Letter } from './exercises.ts';

describe('generated exercises', () => {
  it('spells common major scales in written pitch', () => {
    assert.deepEqual(majorScale('Bb').map(formatSpelled), ['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5', 'Bb5']);
    assert.deepEqual(majorScale('G').map(formatSpelled), ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5']);
    assert.deepEqual(majorScale('Ab').map(formatSpelled), ['Ab4', 'Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5']);
  });

  it('puts a treble key signature on the staff and skips accidentals the signature already shows', () => {
    assert.deepEqual(
      keySignature('Bb').map((mark) => `${mark.letter}${mark.accidental}`),
      ['B-1', 'E-1'],
    );
    assert.equal(keySignature('C').length, 0);
    const measure = new Map<Letter, -1 | 0 | 1>();
    const signature = keySignature('Bb');
    assert.equal(accidentalGlyph(majorScale('Bb')[0]!, signature, measure), '');
    assert.equal(accidentalGlyph({ letter: 'B', accidental: 0, octave: 4 }, signature, measure), '♮');
  });

  it('names every tonic the way the drone screen spells notes', () => {
    for (const key of ['C', 'G', 'D', 'F', 'Bb', 'Eb', 'Ab'] as const) {
      const tonic = formatSpelled(buildExercise('long-tones', key).tonic).replace(/\d+$/, '');
      assert.ok(DRONE_NOTES.includes(tonic), tonic);
    }
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
