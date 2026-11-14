import Slider from '@react-native-community/slider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { playWavLoop, resumeAudio, type LoopHandle } from '@/audio/loopEngine';
import { ChoiceRow, Panel, PrimaryButton, Screen } from '@/components/ui';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { METERS, clampBpm, planClicks, tempoFromTaps } from '@/lib/metronome';
import { renderClickWav } from '@/lib/wav';
import { colors, serif } from '@/theme';

export default function MetronomeScreen() {
  const params = useLocalSearchParams<{ bpm?: string }>();
  const [bpm, setBpm] = useState(100);
  const [liveBpm, setLiveBpm] = useState(100);
  const [meter, setMeter] = useState('4/4');
  const [subdivision, setSubdivision] = useState(1);
  const [accents, setAccents] = useState<boolean[]>([true, false, false, false]);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const [phase, setPhase] = useState(0);
  const [message, setMessage] = useState('');
  const taps = useRef<number[]>([]);
  const selected = METERS.find((item) => item.label === meter) ?? METERS[2]!;
  useConditionalKeepAwake(running, 'metronome');

  useEffect(() => {
    const next = Number(params.bpm);
    if (!Number.isFinite(next) || next <= 0) return;
    const clamped = clampBpm(next);
    setBpm(clamped);
    setLiveBpm(clamped);
  }, [params.bpm]);

  useEffect(() => {
    if (!running) return;
    let handle: LoopHandle | null = null;
    let cancelled = false;
    const plan = planClicks({
      bpm,
      beats: selected.beats,
      subdivision,
      accents,
      bars: 2,
    });
    const wav = renderClickWav(plan);
    resumeAudio()
      .then(() => playWavLoop(wav, 1))
      .then((next) => {
        if (cancelled) {
          next.stop();
          return;
        }
        handle = next;
        setMessage('');
      })
      .catch(() => setMessage('The click could not start. Tap the button again after the phone is awake.'));

    const timer = setInterval(() => {
      if (!handle) return;
      const time = handle.currentTime();
      const beatLength = 60 / bpm;
      const barLength = beatLength * selected.beats;
      const within = ((time % barLength) + barLength) % barLength;
      setBeat(Math.floor(within / beatLength) % selected.beats);
      setPhase((within % beatLength) / beatLength);
    }, 32);

    return () => {
      cancelled = true;
      clearInterval(timer);
      handle?.stop();
    };
  }, [running, bpm, subdivision, meter, accents, selected.beats]);

  const intensity = running ? (1 - phase) ** 2.6 : 0.15;
  const accented = accents[beat] === true;

  return (
    <Screen>
      <View style={styles.readout}>
        <View
          style={[
            styles.pulse,
            {
              transform: [{ scale: 0.86 + intensity * 0.28 }],
              backgroundColor: accented ? colors.brass : colors.frog,
              opacity: 0.35 + intensity * 0.65,
            },
          ]}
        />
        <Text style={styles.bpm}>{liveBpm}</Text>
        <Text style={styles.unit}>BPM · {meter}</Text>
      </View>
      <View style={styles.beats}>
        {accents.map((accent, index) => (
          <Pressable
            key={`${meter}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`Beat ${index + 1}${accent ? ', accented' : ''}`}
            onPress={() =>
              setAccents((current) => current.map((value, beatIndex) => (beatIndex === index ? !value : value)))
            }
            style={[
              styles.beat,
              accent && styles.beatAccent,
              running && beat === index && styles.beatNow,
            ]}
          >
            <Text style={styles.beatText}>{index + 1}</Text>
          </Pressable>
        ))}
      </View>
      <Panel>
        <Slider
          minimumValue={30}
          maximumValue={300}
          step={1}
          value={liveBpm}
          onValueChange={setLiveBpm}
          onSlidingComplete={(value) => {
            const next = clampBpm(value);
            setLiveBpm(next);
            setBpm(next);
          }}
          minimumTrackTintColor={colors.brass}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.brass}
        />
        <View style={styles.nudge}>
          <Pressable accessibilityRole="button" accessibilityLabel="Slower" onPress={() => nudge(-1)} style={styles.nudgeButton}>
            <Text style={styles.nudgeText}>−1</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Faster" onPress={() => nudge(1)} style={styles.nudgeButton}>
            <Text style={styles.nudgeText}>+1</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>The click is a rendered loop, so it does not drift. Tempo is the beat of the time signature: a quarter in 4/4, an eighth in 6/8.</Text>
      </Panel>
      <ChoiceRow
        value={meter}
        onChange={(label) => {
          const next = METERS.find((item) => item.label === label);
          if (!next) return;
          setMeter(label);
          setAccents([...next.accents]);
          setBeat(0);
        }}
        options={METERS.map((item) => ({ value: item.label, label: item.label }))}
      />
      <ChoiceRow
        value={String(subdivision)}
        onChange={(value) => setSubdivision(Number(value))}
        options={[
          { value: '1', label: 'Beat' },
          { value: '2', label: 'Eighths' },
          { value: '3', label: 'Triplets' },
          { value: '4', label: 'Sixteenths' },
        ]}
      />
      <PrimaryButton
        label={running ? 'Stop' : 'Start'}
        tone={running ? 'danger' : 'brass'}
        onPress={() => {
          if (!running) {
            const next = clampBpm(liveBpm);
            setBpm(next);
            setLiveBpm(next);
          }
          setRunning((value) => !value);
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tap tempo"
        onPress={() => {
          const now = performance.now();
          const previous = taps.current[taps.current.length - 1] ?? 0;
          if (now - previous > 2000) taps.current = [];
          taps.current.push(now);
          const tempo = tempoFromTaps(taps.current);
          if (tempo) {
            setBpm(tempo);
            setLiveBpm(tempo);
            setMessage(`Tap tempo ${tempo}`);
          }
        }}
        style={styles.tap}
      >
        <Text style={styles.tapText}>Tap tempo</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );

  function nudge(delta: number) {
    const next = clampBpm(liveBpm + delta);
    setLiveBpm(next);
    setBpm(next);
  }
}

const styles = StyleSheet.create({
  readout: { alignItems: 'center', justifyContent: 'center', height: 210 },
  pulse: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  bpm: { color: colors.ink, fontFamily: serif, fontSize: 92, fontVariant: ['tabular-nums'], lineHeight: 96 },
  unit: { color: colors.muted, fontSize: 16 },
  beats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  beat: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beatAccent: { borderColor: colors.brass },
  beatNow: { backgroundColor: colors.frogDeep },
  beatText: { color: colors.ink, fontVariant: ['tabular-nums'] },
  nudge: { flexDirection: 'row', gap: 8 },
  nudgeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeText: { color: colors.ink, fontSize: 16 },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18 },
  tap: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.frog,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapText: { color: colors.good, fontSize: 16, fontWeight: '700' },
  message: { color: colors.muted, textAlign: 'center' },
});
