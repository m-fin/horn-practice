import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { StaffView } from '@/components/staff';
import { ChoiceRow, Panel, PrimaryButton, Screen } from '@/components/ui';
import { EXERCISE_IDS, KEYS, buildExercise, formatSpelled, type ExerciseId, type KeyName } from '@/lib/exercises';
import { colors } from '@/theme';

const LABELS: Record<ExerciseId, string> = {
  'long-tones': 'Long tones',
  'major-scale': 'Major scale',
  thirds: 'Thirds',
  chromatic: 'Chromatic',
};

export default function ExercisesScreen() {
  const router = useRouter();
  const [keyName, setKeyName] = useState<KeyName>('Bb');
  const [exerciseId, setExerciseId] = useState<ExerciseId>('long-tones');
  const exercise = useMemo(() => buildExercise(exerciseId, keyName), [exerciseId, keyName]);
  const tonic = formatSpelled(exercise.tonic).replace(/-?\d+$/, '');

  return (
    <Screen>
      <Text style={styles.lead}>
        Written pitch for the horn in your hand. These are generic scales and long tones made for this app, not transcriptions and not a published method book.
      </Text>
      <ChoiceRow
        value={exerciseId}
        onChange={(value) => setExerciseId(value as ExerciseId)}
        options={EXERCISE_IDS.map((id) => ({ value: id, label: LABELS[id] }))}
      />
      <ChoiceRow
        value={keyName}
        onChange={(value) => setKeyName(value as KeyName)}
        options={KEYS.map((key) => ({ value: key, label: key }))}
      />
      <Panel>
        <Text style={styles.title}>
          {exercise.title} in {keyName}
        </Text>
        <Text style={styles.body}>{exercise.instruction}</Text>
        <Text style={styles.meta}>Suggested tempo {exercise.bpm}. 4/4.</Text>
      </Panel>
      <StaffView notes={exercise.notes} beats={exercise.beats} />
      <PrimaryButton
        label={`Metronome at ${exercise.bpm}`}
        onPress={() => router.push({ pathname: '/metronome', params: { bpm: String(exercise.bpm) } })}
      />
      <PrimaryButton
        label={`Drone ${tonic}${exercise.tonic.octave}`}
        tone="frog"
        onPress={() =>
          router.push({
            pathname: '/drone',
            params: { note: tonic, octave: String(exercise.tonic.octave) },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  meta: { color: colors.brass, fontSize: 14 },
});
