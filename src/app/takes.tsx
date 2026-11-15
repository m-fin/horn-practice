import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { resumeAudio } from '@/audio/loopEngine';
import { Panel, PrimaryButton, Screen } from '@/components/ui';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { takeDownloadName } from '@/lib/audioFile';
import { formatClock } from '@/lib/streak';
import { deleteTake, loadTakes, renameTake, saveTake, type Take } from '@/state/takes';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

export default function TakesScreen() {
  const { instrument } = useInstrument();
  const [takes, setTakes] = useState<Take[]>([]);
  const [message, setMessage] = useState('Record a take, listen back, then send it for the weekly sonicrift recording.');
  const [activeId, setActiveId] = useState<string | null>(null);
  const stopping = useRef(false);
  const instrumentRef = useRef(instrument);
  instrumentRef.current = instrument;
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
    directory: 'document',
  });
  const state = useAudioRecorderState(recorder, 200);
  const player = useAudioPlayer();
  const playback = useAudioPlayerStatus(player);
  const finished = useRef(false);
  useConditionalKeepAwake(state.isRecording, 'takes');

  useEffect(() => {
    if (playback.didJustFinish && !finished.current && activeId) setActiveId(null);
    finished.current = playback.didJustFinish;
  }, [playback.didJustFinish, activeId]);

  useEffect(() => {
    loadTakes().then(setTakes).catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      if (stopping.current || !recorder.getStatus().isRecording) return;
      stopping.current = true;
      const durationMillis = recorder.getStatus().durationMillis;
      const horn = instrumentRef.current;
      void (async () => {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) return;
        await saveTake({
          id: `${Date.now()}`,
          sourceUri: uri,
          createdAt: Date.now(),
          instrument: horn,
          durationMillis,
          note: datedNote(Date.now()),
        });
      })();
    };
  }, [recorder]);

  return (
    <Screen>
      <Text style={styles.lead}>{message}</Text>
      <Text style={styles.clock}>{state.isRecording ? formatClock(state.durationMillis) : '00:00'}</Text>
      <PrimaryButton
        label={state.isRecording ? 'Stop and keep' : 'Record'}
        tone={state.isRecording ? 'danger' : 'brass'}
        onPress={() => {
          if (state.isRecording) {
            stop().catch(() => setMessage('The take did not save.'));
            return;
          }
          void resumeAudio();
          begin().catch((error: unknown) => {
            setMessage(error instanceof Error ? error.message : 'Recording is unavailable.');
          });
        }}
      />
      {takes.length === 0 ? (
        <Panel>
          <Text style={styles.empty}>No takes yet. The file stays on this phone until you delete it or send it.</Text>
        </Panel>
      ) : null}
      {takes.map((take) => (
        <Panel key={take.id}>
          <Text style={styles.title}>{take.note || 'Take'}</Text>
          <Text style={styles.meta}>
            {new Date(take.createdAt).toLocaleString()} · {formatClock(take.durationMillis)} ·{' '}
            {take.instrument === 'bb-trumpet' ? 'trumpet' : 'alto'}
          </Text>
          <TextInput
            value={take.note}
            onChangeText={(note) => {
              setTakes((current) => current.map((item) => (item.id === take.id ? { ...item, note } : item)));
            }}
            onEndEditing={(event) => {
              renameTake(take.id, event.nativeEvent.text).catch(() => undefined);
            }}
            style={styles.input}
            placeholder="Label this take"
            placeholderTextColor={colors.faint}
            accessibilityLabel="Take label"
          />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={activeId === take.id ? 'Stop playback' : 'Play take'}
              onPress={() => {
                if (activeId === take.id) {
                  player.pause();
                  setActiveId(null);
                  return;
                }
                player.replace({ uri: take.uri });
                player.play();
                setActiveId(take.id);
              }}
              style={styles.action}
            >
              <Text style={styles.actionText}>{activeId === take.id ? 'Stop' : 'Play'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send take"
              onPress={() => {
                share(take).catch(() => setMessage('Could not send that take.'));
              }}
              style={styles.action}
            >
              <Text style={styles.actionText}>Send</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete take"
              onPress={() => {
                if (activeId === take.id) player.pause();
                deleteTake(take.id)
                  .then(setTakes)
                  .catch(() => setMessage('Could not delete that take.'));
              }}
              style={styles.action}
            >
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
          </View>
        </Panel>
      ))}
    </Screen>
  );

  async function begin() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) throw new Error('Microphone access is off. Enable it to record a take.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setMessage('Recording. Stop when the take is done.');
  }

  async function stop() {
    if (stopping.current) return;
    stopping.current = true;
    try {
      const durationMillis = Math.max(state.durationMillis, recorder.getStatus().durationMillis);
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('The recording file is missing.');
      const createdAt = Date.now();
      const note = datedNote(createdAt);
      const next = await saveTake({
        id: `${createdAt}`,
        sourceUri: uri,
        createdAt,
        instrument,
        durationMillis,
        note,
      });
      setTakes(next);
      setMessage('Take saved. Play it back, then send it.');
    } finally {
      stopping.current = false;
    }
  }

  async function share(take: Take) {
    if (Platform.OS === 'web') {
      const response = await fetch(take.uri);
      const blob = await response.blob();
      const mime = blob.type || 'audio/webm';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = takeDownloadName(take.note, mime);
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Download started. Attach that file to the sonicrift note.');
      return;
    }
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      setMessage('Sharing is not available on this device.');
      return;
    }
    await Sharing.shareAsync(take.uri, {
      dialogTitle: take.note || 'Practice take',
      mimeType: 'audio/m4a',
    });
  }
}

function datedNote(createdAt: number): string {
  const stamp = new Date(createdAt);
  return `sonicrift ${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  clock: { color: colors.ink, fontFamily: serif, fontSize: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  empty: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.faint, fontSize: 13 },
  input: {
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: colors.brass, fontWeight: '700' },
});
