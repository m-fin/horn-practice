export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

export type SpelledNote = {
  letter: Letter;
  accidental: -1 | 0 | 1;
  octave: number;
};

export type ExerciseNote = SpelledNote & { quarters: number };

export const KEYS = ['C', 'G', 'D', 'F', 'Bb', 'Eb', 'Ab'] as const;
export type KeyName = (typeof KEYS)[number];

export type ExerciseId = 'long-tones' | 'major-scale' | 'thirds' | 'chromatic';

const LETTER_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const TONIC: Record<KeyName, SpelledNote> = {
  C: { letter: 'C', accidental: 0, octave: 4 },
  G: { letter: 'G', accidental: 0, octave: 4 },
  D: { letter: 'D', accidental: 0, octave: 4 },
  F: { letter: 'F', accidental: 0, octave: 4 },
  Bb: { letter: 'B', accidental: -1, octave: 4 },
  Eb: { letter: 'E', accidental: -1, octave: 4 },
  Ab: { letter: 'A', accidental: -1, octave: 4 },
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];

export function spelledToMidi(note: SpelledNote): number {
  const pitchClass = (LETTER_PC[note.letter] + note.accidental + 12) % 12;
  return (note.octave + 1) * 12 + pitchClass;
}

export function formatSpelled(note: SpelledNote): string {
  const accidental = note.accidental === 1 ? '#' : note.accidental === -1 ? 'b' : '';
  return `${note.letter}${accidental}${note.octave}`;
}

export function spellMidi(midi: number, prefer: 'sharp' | 'flat'): SpelledNote {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const sharp: [Letter, -1 | 0 | 1][] = [
    ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
    ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
  ];
  const flat: [Letter, -1 | 0 | 1][] = [
    ['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0],
    ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0],
  ];
  const chosen = (prefer === 'flat' ? flat : sharp)[pitchClass] ?? ['C', 0];
  return { letter: chosen[0], accidental: chosen[1], octave };
}

export function majorScale(key: KeyName): SpelledNote[] {
  const tonic = TONIC[key];
  const start = spelledToMidi(tonic);
  const letterIndex = LETTERS.indexOf(tonic.letter);
  return MAJOR.map((semitone, degree) => {
    const letter = LETTERS[(letterIndex + degree) % 7] ?? 'C';
    const midi = start + semitone;
    let octave = tonic.octave + Math.floor((letterIndex + degree) / 7);
    let accidental = midi - spelledToMidi({ letter, accidental: 0, octave });
    while (accidental > 1) {
      octave += 1;
      accidental = midi - spelledToMidi({ letter, accidental: 0, octave });
    }
    while (accidental < -1) {
      octave -= 1;
      accidental = midi - spelledToMidi({ letter, accidental: 0, octave });
    }
    return { letter, accidental: accidental as -1 | 0 | 1, octave };
  });
}

export function diatonicFromE4(note: SpelledNote): number {
  return (note.octave - 4) * 7 + (LETTERS.indexOf(note.letter) - 2);
}

export type BuiltExercise = {
  id: ExerciseId;
  title: string;
  instruction: string;
  bpm: number;
  beats: number;
  notes: ExerciseNote[];
  tonic: SpelledNote;
};

const EXERCISE_COPY: Record<ExerciseId, { title: string; instruction: string; bpm: number }> = {
  'long-tones': {
    title: 'Long tones',
    instruction:
      'One whole note at a time. Soft attack, steady air, and a clean release. Rest whenever the air runs out. This pattern is generated here — it is not from a published method.',
    bpm: 60,
  },
  'major-scale': {
    title: 'Major scale',
    instruction:
      'Slur four quarters, then breathe. Keep the fingers close to the keys or valves. A generic scale, written in treble clef for whichever horn you selected.',
    bpm: 80,
  },
  thirds: {
    title: 'Scale in thirds',
    instruction:
      'Tongue lightly and hear the third before you move. Useful for intonation against the drone. Generic interval pattern, not a copied etude.',
    bpm: 72,
  },
  chromatic: {
    title: 'Chromatic long tones',
    instruction:
      'Half notes, two to a breath. Slide each pitch in until the tuner needle sits still. Half-step pattern generated for this app.',
    bpm: 60,
  },
};

export function buildExercise(id: ExerciseId, key: KeyName): BuiltExercise {
  const scale = majorScale(key);
  const copy = EXERCISE_COPY[id];
  const tonic = scale[0] ?? TONIC[key];
  let notes: ExerciseNote[];
  if (id === 'long-tones') {
    notes = scale.map((note) => ({ ...note, quarters: 4 }));
  } else if (id === 'major-scale') {
    notes = [...scale, ...scale.slice(0, -1).reverse()].map((note) => ({ ...note, quarters: 1 }));
  } else if (id === 'thirds') {
    const pairs: SpelledNote[] = [];
    for (let index = 0; index + 2 < scale.length; index++) {
      const lower = scale[index];
      const upper = scale[index + 2];
      if (lower && upper) pairs.push(lower, upper);
    }
    for (let index = scale.length - 1; index >= 2; index--) {
      const upper = scale[index];
      const lower = scale[index - 2];
      if (upper && lower) pairs.push(upper, lower);
    }
    notes = pairs.map((note) => ({ ...note, quarters: 1 }));
  } else {
    const prefer = key === 'C' || key === 'G' || key === 'D' ? 'sharp' : 'flat';
    const start = spelledToMidi(tonic);
    const midis: number[] = [];
    for (let step = 0; step <= 6; step++) midis.push(start + step);
    for (let step = 5; step >= 0; step--) midis.push(start + step);
    notes = midis.map((midi) => ({ ...spellMidi(midi, prefer), quarters: 2 }));
  }
  return { id, title: copy.title, instruction: copy.instruction, bpm: copy.bpm, beats: 4, notes, tonic };
}

export const EXERCISE_IDS: ExerciseId[] = ['long-tones', 'major-scale', 'thirds', 'chromatic'];
