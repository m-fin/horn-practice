import Slider from '@react-native-community/slider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { playWavLoop, resumeAudio, type LoopHandle } from '@/audio/loopEngine';
import { ChoiceRow, InstrumentSwitch, Panel, PrimaryButton, Screen } from '@/components/ui';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { DRONE_NOTES, formatPitch, nameMidi, writtenFrequency, type InstrumentId } from '@/lib/pitch';
import { renderDroneWav } from '@/lib/wav';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

export default function DroneScreen() {
  const { instrument } = useInstrument();
  const params = useLocalSearchParams<{ note?: string; octave?: string }>();
  const [note, setNote] = useState('C');
  const [octave, setOctave] = useState(4);
  const [fifth, setFifth] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const volumeRef = useRef(volume);
  const handleRef = useRef<LoopHandle | null>(null);
  volumeRef.current = volume;
  useConditionalKeepAwake(playing, 'drone');

  useEffect(() => {
    if (params.note && (DRONE_NOTES as readonly string[]).includes(params.note)) setNote(params.note);
    const nextOctave = Number(params.octave);
    if (Number.isFinite(nextOctave)) setOctave(Math.min(6, Math.max(3, Math.round(nextOctave))));
  }, [params.note, params.octave]);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const frequency = writtenFrequency(note, octave, instrument);
    const wav = renderDroneWav(frequency, fifth);
    resumeAudio()
      .then(() => playWavLoop(wav, volumeRef.current))
      .then((handle) => {
        if (cancelled) {
          handle.stop();
          return;
        }
        handleRef.current = handle;
        setMessage('');
      })
      .catch(() => setMessage('The drone could not start.'));
    return () => {
      cancelled = true;
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, [playing, note, octave, fifth, instrument]);

  const frequency = writtenFrequency(note, octave, instrument);
  const concert = nameMidi(69 + 12 * Math.log2(frequency / 440), true);

  return (
    <Screen>
      <Text style={styles.lead}>
        A written {note}
        {octave} for the selected horn. The speaker sounds the concert pitch, so you can match it. Use headphones if the tuner is open.
      </Text>
      <InstrumentSwitch />
      <Text style={styles.pitch}>
        {note}
        {octave}
      </Text>
      <Text style={styles.sounding}>
        Sounds {formatPitch(concert)} · {frequency.toFixed(1)} Hz
      </Text>
      <ChoiceRow
        value={note}
        onChange={setNote}
        options={DRONE_NOTES.map((name) => ({ value: name, label: name }))}
      />
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Octave down" onPress={() => setOctave((value) => Math.max(3, value - 1))} style={styles.step}>
          <Text style={styles.stepText}>Octave −</Text>
        </Pressable>
        <Text style={styles.octave}>Octave {octave}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Octave up" onPress={() => setOctave((value) => Math.min(6, value + 1))} style={styles.step}>
          <Text style={styles.stepText}>Octave +</Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={() => applyPreset('band', instrument)} style={styles.step}>
          <Text style={styles.stepText}>Band Bb</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => applyPreset('a', instrument)} style={styles.step}>
          <Text style={styles.stepText}>Concert A</Text>
        </Pressable>
      </View>
      <Panel>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: fifth }} onPress={() => setFifth((value) => !value)}>
          <Text style={styles.fifth}>{fifth ? 'Fifth above is on' : 'Add a fifth above'}</Text>
        </Pressable>
        <Text style={styles.volumeLabel}>Volume</Text>
        <Slider
          minimumValue={0.05}
          maximumValue={1}
          value={volume}
          onValueChange={(value) => {
            setVolume(value);
            handleRef.current?.setVolume(value);
          }}
          minimumTrackTintColor={colors.frog}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.frog}
        />
      </Panel>
      <PrimaryButton
        label={playing ? 'Stop drone' : 'Play drone'}
        tone={playing ? 'danger' : 'frog'}
        onPress={() => {
          void resumeAudio();
          setPlaying((value) => !value);
        }}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );

  function applyPreset(kind: 'band' | 'a', horn: InstrumentId) {
    if (kind === 'band') {
      setNote(horn === 'bb-trumpet' ? 'C' : 'G');
      setOctave(5);
      return;
    }
    setNote(horn === 'bb-trumpet' ? 'B' : 'F#');
    setOctave(horn === 'bb-trumpet' ? 4 : 5);
  }
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  pitch: { color: colors.ink, fontFamily: serif, fontSize: 72, textAlign: 'center' },
  sounding: { color: colors.brass, textAlign: 'center', fontSize: 16 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  step: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepText: { color: colors.ink, fontWeight: '600' },
  octave: { color: colors.muted, fontVariant: ['tabular-nums'] },
  fifth: { color: colors.ink, fontSize: 16 },
  volumeLabel: { color: colors.faint, fontSize: 13 },
  message: { color: colors.danger, textAlign: 'center' },
});
