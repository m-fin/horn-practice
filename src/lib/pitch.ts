export type InstrumentId = 'bb-trumpet' | 'eb-alto';

export const INSTRUMENTS: Record<
  InstrumentId,
  { label: string; short: string; writtenSemitones: number }
> = {
  'bb-trumpet': { label: 'Bb trumpet', short: 'Trumpet', writtenSemitones: 2 },
  'eb-alto': { label: 'Eb alto sax', short: 'Alto sax', writtenSemitones: 9 },
};

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const PITCH_CLASS: Record<string, number> = {};
SHARP.forEach((name, index) => {
  PITCH_CLASS[name] = index;
});
FLAT.forEach((name, index) => {
  PITCH_CLASS[name] = index;
});

export type NamedPitch = {
  name: string;
  octave: number;
  midi: number;
  cents: number;
};

export type PitchReading = {
  frequency: number;
  written: NamedPitch;
  concert: NamedPitch;
  inTune: boolean;
};

export function frequencyToMidi(frequency: number, a4 = 440): number {
  return 69 + 12 * Math.log2(frequency / a4);
}

export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

export function nameToPitchClass(name: string): number {
  const pitchClass = PITCH_CLASS[name];
  if (pitchClass === undefined) {
    throw new Error(`Unknown note ${name}`);
  }
  return pitchClass;
}

export function nameMidi(midiFloat: number, flats: boolean): NamedPitch {
  const midi = Math.round(midiFloat);
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return {
    name: (flats ? FLAT : SHARP)[pitchClass],
    octave,
    midi,
    cents: (midiFloat - midi) * 100,
  };
}

/** Written pitch sits above concert pitch by the instrument's transposition. */
export function analyzePitch(frequency: number, instrument: InstrumentId, a4 = 440): PitchReading {
  const concertMidi = frequencyToMidi(frequency, a4);
  const writtenMidi = concertMidi + INSTRUMENTS[instrument].writtenSemitones;
  const written = nameMidi(writtenMidi, true);
  const concert = nameMidi(concertMidi, true);
  return {
    frequency,
    written,
    concert,
    inTune: Math.abs(written.cents) <= 5,
  };
}

/** Frequency a written note should sound at for this horn. */
export function writtenFrequency(
  name: string,
  octave: number,
  instrument: InstrumentId,
  a4 = 440,
): number {
  const writtenMidi = (octave + 1) * 12 + nameToPitchClass(name);
  return midiToFrequency(writtenMidi - INSTRUMENTS[instrument].writtenSemitones, a4);
}

export function formatPitch(pitch: NamedPitch): string {
  return `${pitch.name}${pitch.octave}`;
}

export function formatCents(cents: number): string {
  const rounded = Math.round(cents);
  if (rounded > 0) return `+${rounded}`;
  return String(rounded);
}
