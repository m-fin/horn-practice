import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Line, Text as SvgText } from 'react-native-svg';
import {
  accidentalGlyph,
  diatonicFromE4,
  keySignature,
  type ExerciseNote,
  type KeyName,
  type Letter,
} from '@/lib/exercises';
import { colors } from '@/theme';

const LINE = 12;
const STEP = LINE / 2;
const QUARTER = 36;

export function StaffView({ notes, beats, keyName }: { notes: ExerciseNote[]; beats: number; keyName: KeyName }) {
  const signature = keySignature(keyName);
  const left = signature.length === 0 ? 72 : 52 + signature.length * 16 + 22;
  const totalQuarters = notes.reduce((sum, note) => sum + note.quarters, 0);
  const measures = Math.max(1, Math.ceil(totalQuarters / beats));
  const width = left + measures * beats * QUARTER + 28;
  const steps = [...notes.map((note) => diatonicFromE4(note)), ...signature.map((mark) => mark.step)];
  const minStep = Math.min(0, ...steps);
  const maxStep = Math.max(8, ...steps);
  const top = 36 + Math.max(0, maxStep - 8) * STEP;
  const bottom = top + 4 * LINE;
  const height = bottom + 36 + Math.max(0, -minStep) * STEP;
  const yFor = (step: number) => bottom - step * STEP;

  let cursor = 0;
  let measureIndex = -1;
  let measure = new Map<Letter, -1 | 0 | 1>();
  const placed = notes.map((note) => {
    const nextMeasure = Math.floor(cursor / beats);
    if (nextMeasure !== measureIndex) {
      measureIndex = nextMeasure;
      measure = new Map();
    }
    const glyph = accidentalGlyph(note, signature, measure);
    const x = left + cursor * QUARTER + (note.quarters * QUARTER) / 2;
    cursor += note.quarters;
    return { note, x, step: diatonicFromE4(note), glyph };
  });

  return (
    <View style={styles.paper}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={width} height={height}>
          <SvgText x={8} y={bottom + 6} fill={colors.staff} fontSize={54}>
            𝄞
          </SvgText>
          {signature.map((mark, index) => (
            <SvgText key={`${mark.letter}-${index}`} x={46 + index * 16} y={yFor(mark.step) + 5} fill={colors.staff} fontSize={18}>
              {mark.accidental === 1 ? '♯' : '♭'}
            </SvgText>
          ))}
          {[0, 1, 2, 3, 4].map((line) => (
            <Line
              key={line}
              x1={36}
              x2={width - 16}
              y1={top + line * LINE}
              y2={top + line * LINE}
              stroke={colors.staff}
              strokeWidth={1.2}
            />
          ))}
          {Array.from({ length: measures + 1 }, (_, measureNumber) => {
            const x = left + measureNumber * beats * QUARTER - 14;
            return (
              <Line
                key={`bar-${measureNumber}`}
                x1={x}
                x2={x}
                y1={top}
                y2={bottom}
                stroke={colors.staff}
                strokeWidth={measureNumber === measures ? 3 : 1.2}
              />
            );
          })}
          {placed.map((item, index) => {
            const y = yFor(item.step);
            const filled = item.note.quarters <= 1;
            const stemUp = item.step < 4;
            const ledgers: number[] = [];
            if (item.step <= -2) {
              for (let step = -2; step >= item.step; step -= 2) ledgers.push(step);
            }
            if (item.step >= 10) {
              for (let step = 10; step <= item.step; step += 2) ledgers.push(step);
            }
            const stemX = stemUp ? item.x + 6.2 : item.x - 6.2;
            return (
              <G key={`${item.note.letter}-${index}`}>
                {ledgers.map((step) => (
                  <Line
                    key={step}
                    x1={item.x - 12}
                    x2={item.x + 12}
                    y1={yFor(step)}
                    y2={yFor(step)}
                    stroke={colors.staff}
                    strokeWidth={1.2}
                  />
                ))}
                {item.glyph ? (
                  <SvgText x={item.x - 22} y={y + 5} fill={colors.staff} fontSize={18}>
                    {item.glyph}
                  </SvgText>
                ) : null}
                <Ellipse
                  cx={item.x}
                  cy={y}
                  rx={7.2}
                  ry={5}
                  fill={filled ? colors.staff : colors.paper}
                  stroke={colors.staff}
                  strokeWidth={1.7}
                  transform={`rotate(-18 ${item.x} ${y})`}
                />
                {item.note.quarters < 4 ? (
                  <Line
                    x1={stemX}
                    x2={stemX}
                    y1={y}
                    y2={stemUp ? y - 34 : y + 34}
                    stroke={colors.staff}
                    strokeWidth={1.4}
                  />
                ) : null}
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
