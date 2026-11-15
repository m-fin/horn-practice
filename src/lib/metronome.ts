export const MIN_BPM = 30;
export const MAX_BPM = 300;

export type Click = {
  time: number;
  accent: boolean;
  beat: number;
  sub: number;
};

export type ClickPlan = {
  clicks: Click[];
  duration: number;
  bpm: number;
  beats: number;
  subdivision: number;
};

export function clampBpm(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

/** Average the recent tap gaps. Gaps outside 30–300 are ignored. */
export function tempoFromTaps(timesMs: number[]): number | null {
  if (timesMs.length < 2) return null;
  const recent = timesMs.slice(-6);
  const intervals: number[] = [];
  const minGap = 60000 / MAX_BPM;
  const maxGap = 60000 / MIN_BPM;
  for (let i = 1; i < recent.length; i++) {
    const gap = (recent[i] ?? 0) - (recent[i - 1] ?? 0);
    if (gap >= minGap && gap <= maxGap) intervals.push(gap);
  }
  if (intervals.length === 0) return null;
  const average = intervals.reduce((sum, gap) => sum + gap, 0) / intervals.length;
  return clampBpm(60000 / average);
}

export function planClicks(options: {
  bpm: number;
  beats: number;
  subdivision: number;
  accents: boolean[];
  bars?: number;
}): ClickPlan {
  const bpm = clampBpm(options.bpm);
  const beats = Math.max(1, Math.min(16, Math.round(options.beats)));
  const subdivision = Math.max(1, Math.min(4, Math.round(options.subdivision)));
  const bars = options.bars ?? 2;
  const beat = 60 / bpm;
  const step = beat / subdivision;
  const clicks: Click[] = [];
  const totalBeats = bars * beats;
  for (let index = 0; index < totalBeats; index++) {
    const beatInBar = index % beats;
    for (let sub = 0; sub < subdivision; sub++) {
      clicks.push({
        time: index * beat + sub * step,
        accent: sub === 0 && options.accents[beatInBar] === true,
        beat: beatInBar,
        sub,
      });
    }
  }
  return {
    clicks,
    duration: totalBeats * beat,
    bpm,
    beats,
    subdivision,
  };
}

const SUBDIVISION_LABELS: Record<number, [string, string, string, string]> = {
  4: ['Quarter', 'Eighths', 'Triplets', 'Sixteenths'],
  8: ['Eighth', 'Sixteenths', 'Triplets', '32nds'],
};

/** Labels are subdivisions of the beat, so 6/8 does not call a sixteenth an eighth. */
export function subdivisionChoices(noteValue: number): { value: string; label: string }[] {
  const labels = SUBDIVISION_LABELS[noteValue] ?? ['Beat', '×2', '×3', '×4'];
  return labels.map((label, index) => ({ value: String(index + 1), label }));
}

export const METERS: { label: string; beats: number; noteValue: number; accents: boolean[] }[] = [
  { label: '2/4', beats: 2, noteValue: 4, accents: [true, false] },
  { label: '3/4', beats: 3, noteValue: 4, accents: [true, false, false] },
  { label: '4/4', beats: 4, noteValue: 4, accents: [true, false, false, false] },
  { label: '5/4', beats: 5, noteValue: 4, accents: [true, false, false, true, false] },
  { label: '3/8', beats: 3, noteValue: 8, accents: [true, false, false] },
  { label: '6/8', beats: 6, noteValue: 8, accents: [true, false, false, true, false, false] },
  { label: '7/8', beats: 7, noteValue: 8, accents: [true, false, false, true, false, true, false] },
  { label: '12/8', beats: 12, noteValue: 8, accents: [true, false, false, true, false, false, true, false, false, true, false, false] },
];
