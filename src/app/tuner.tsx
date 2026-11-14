import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream, type AudioStreamBuffer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { resumeAudio, sharedAudioContext } from '@/audio/loopEngine';
import { ChoiceRow, Panel, PrimaryButton, Screen } from '@/components/ui';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { analyzePitch, formatCents, formatPitch, type PitchReading } from '@/lib/pitch';
import { detectPitchYin, rms } from '@/lib/yin';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

type Capture = { stop: () => void };

export default function TunerScreen() {
  const { instrument } = useInstrument();
  const [listening, setListening] = useState(false);
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [level, setLevel] = useState(0);
  const [a4, setA4] = useState(440);
  const [message, setMessage] = useState('Play a long tone. The note is written pitch for the horn you selected.');
  const samples = useRef<number[]>([]);
  const lastUi = useRef(0);
  const capture = useRef<Capture | null>(null);
  const instrumentRef = useRef(instrument);
  const a4Ref = useRef(a4);
  const onBuffer = useRef<(buffer: AudioStreamBuffer) => void>(() => {});
  instrumentRef.current = instrument;
  a4Ref.current = a4;
  const streamApi = useAudioStream({
    sampleRate: 48000,
    channels: 1,
    encoding: 'float32',
    onBuffer: (buffer) => onBuffer.current(buffer),
  });
  useConditionalKeepAwake(listening, 'tuner');

  useEffect(() => {
    onBuffer.current = (buffer) => {
      const view = new Float32Array(buffer.data);
      const mono: number[] = [];
      const channels = Math.max(1, buffer.channels);
      for (let index = 0; index < view.length; index += channels) mono.push(view[index] ?? 0);
      pushSamples(mono, buffer.sampleRate || 48000);
    };
  });

  function pushSamples(frame: ArrayLike<number>, sampleRate: number) {
    const bucket = samples.current;
    for (let index = 0; index < frame.length; index++) bucket.push(frame[index] ?? 0);
    const need = Math.floor(sampleRate * 0.12);
    if (bucket.length < need) return;
    const now = performance.now();
    if (now - lastUi.current >= 80) {
      const slice = Float32Array.from(bucket.slice(bucket.length - need));
      const strength = rms(slice);
      setLevel(strength);
      if (strength < 0.012) {
        setReading(null);
      } else {
        const hit = detectPitchYin(slice, sampleRate);
        setReading(hit ? analyzePitch(hit.frequency, instrumentRef.current, a4Ref.current) : null);
      }
      lastUi.current = now;
    }
    if (bucket.length > need * 2) bucket.splice(0, bucket.length - need);
  }

  const streamRef = useRef(streamApi.stream);
  streamRef.current = streamApi.stream;
  useEffect(() => {
    return () => {
      capture.current?.stop();
      streamRef.current?.stop();
    };
  }, []);

  const cents = reading?.written.cents ?? 0;
  const clamped = Math.max(-50, Math.min(50, cents));
  const tone = !reading ? colors.faint : reading.inTune ? colors.good : Math.abs(cents) <= 15 ? colors.warn : colors.danger;

  return (
    <Screen>
      <Text style={styles.help}>{message}</Text>
      <View style={styles.noteWrap}>
        <Text style={[styles.note, { color: tone }]}>{reading ? reading.written.name : '–'}</Text>
        <Text style={styles.octave}>{reading ? reading.written.octave : ''}</Text>
      </View>
      <Text style={styles.cents}>{reading ? `${formatCents(reading.written.cents)} cents` : 'cents'}</Text>
      <View style={styles.needleTrack}>
        <View style={styles.centerMark} />
        <View style={[styles.needle, { left: `${50 + clamped}%`, backgroundColor: tone }]} />
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meter, { width: `${Math.min(100, level * 400)}%` }]} />
      </View>
      <Panel>
        <Text style={styles.concert}>
          {reading
            ? `Concert ${formatPitch(reading.concert)} · ${reading.frequency.toFixed(1)} Hz`
            : 'Concert pitch appears when the mic hears a tone.'}
        </Text>
        <Text style={styles.reference}>A4 reference {a4} Hz</Text>
        <ChoiceRow
          value={String(a4)}
          onChange={(value) => setA4(Number(value))}
          options={[438, 440, 442, 444].map((value) => ({ value: String(value), label: String(value) }))}
        />
      </Panel>
      <PrimaryButton
        label={listening ? 'Stop listening' : 'Listen'}
        tone={listening ? 'danger' : 'frog'}
        onPress={() => {
          if (listening) {
            capture.current?.stop();
            capture.current = null;
            streamApi.stream?.stop();
            samples.current = [];
            setListening(false);
            setReading(null);
            return;
          }
          start()
            .then(() => {
              setListening(true);
              setMessage('Written pitch. Trumpet C sounds concert Bb. Alto G sounds concert Bb.');
            })
            .catch((error: unknown) => {
              const text = error instanceof Error ? error.message : 'The microphone is unavailable.';
              setMessage(text);
            });
        }}
      />
    </Screen>
  );

  async function start() {
    samples.current = [];
    if (Platform.OS === 'web') {
      await resumeAudio();
      const context = sharedAudioContext();
      if (!context || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser has no microphone.');
      }
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const source = context.createMediaStreamSource(media);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const mute = context.createGain();
      mute.gain.value = 0;
      processor.onaudioprocess = (event) => {
        const channel = event.inputBuffer.getChannelData(0);
        const copy = new Float32Array(channel.length);
        copy.set(channel);
        pushSamples(copy, context.sampleRate);
      };
      source.connect(processor);
      processor.connect(mute);
      mute.connect(context.destination);
      capture.current = {
        stop() {
          processor.disconnect();
          source.disconnect();
          mute.disconnect();
          media.getTracks().forEach((track) => track.stop());
        },
      };
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) throw new Error('Microphone access is off. Enable it in Settings to tune.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    if (!streamApi.stream) throw new Error('The tuner stream is not available on this device.');
    await streamApi.stream.start();
  }
}

const styles = StyleSheet.create({
  help: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  noteWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, minHeight: 120 },
  note: { fontFamily: serif, fontSize: 108, lineHeight: 112 },
  octave: { color: colors.muted, fontSize: 32, marginBottom: 16 },
  cents: { color: colors.ink, textAlign: 'center', fontSize: 22, fontVariant: ['tabular-nums'] },
  needleTrack: {
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  centerMark: { position: 'absolute', left: '50%', width: 2, height: 28, backgroundColor: colors.ink },
  needle: { position: 'absolute', width: 10, height: 22, borderRadius: 5, marginLeft: -5 },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  meter: { height: 8, backgroundColor: colors.frog },
  concert: { color: colors.ink, fontSize: 16 },
  reference: { color: colors.faint, fontSize: 13 },
});
