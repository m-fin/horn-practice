import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Panel, PrimaryButton, Screen } from '@/components/ui';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { formatClock, formatMinutes, localDayKey, previousDay, summarize } from '@/lib/streak';
import { addSession, loadSessions, type PracticeSession } from '@/state/log';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

const QUICK_MINUTES = [10, 15, 20, 30, 45, 60];

export default function TimerScreen() {
  const { instrument } = useInstrument();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [running, setRunning] = useState(false);
  const [accumulated, setAccumulated] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [note, setNote] = useState('');
  useConditionalKeepAwake(running, 'timer');

  useEffect(() => {
    loadSessions().then(setSessions).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [running]);

  const elapsed = accumulated + (running && startedAt ? now - startedAt : 0);
  const summary = summarize(sessions, Date.now());
  const practiced = new Set(sessions.map((session) => localDayKey(session.startedAt)));

  return (
    <Screen>
      <Text style={styles.clock}>{formatClock(elapsed)}</Text>
      <View style={styles.row}>
        <PrimaryButton
          label={running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          onPress={() => {
            if (running) {
              setAccumulated(elapsed);
              setStartedAt(null);
              setRunning(false);
              return;
            }
            setStartedAt(Date.now());
            setRunning(true);
            setNote('');
          }}
        />
      </View>
      <PrimaryButton
        label="Save session"
        tone="frog"
        onPress={() => {
          const durationSec = Math.round(elapsed / 1000);
          if (durationSec < 10) {
            setNote('Keep going a little longer — ten seconds is the shortest log.');
            return;
          }
          const session: PracticeSession = {
            id: `${Date.now()}`,
            startedAt: Date.now() - durationSec * 1000,
            durationSec,
            instrument,
            kind: 'timer',
          };
          addSession(session)
            .then((next) => {
              setSessions(next);
              setRunning(false);
              setStartedAt(null);
              setAccumulated(0);
              setNote(`Logged ${formatMinutes(durationSec)}.`);
            })
            .catch(() => setNote('Could not save that session.'));
        }}
      />
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.stats}>
        <Stat label="Streak" value={summary.streak.current === 1 ? '1 day' : `${summary.streak.current} days`} />
        <Stat label="Best" value={summary.streak.longest === 1 ? '1 day' : `${summary.streak.longest} days`} />
        <Stat label="Today" value={formatMinutes(summary.todaySec)} />
      </View>
      <Panel>
        <Text style={styles.section}>Last 12 weeks</Text>
        <Heatmap days={practiced} today={summary.today} />
        <Text style={styles.hint}>A day counts once you save a session. The screen stays awake while the timer runs.</Text>
      </Panel>
      <Panel>
        <Text style={styles.section}>Log time you already practiced</Text>
        <View style={styles.chips}>
          {QUICK_MINUTES.map((minutes) => (
            <Pressable
              key={minutes}
              accessibilityRole="button"
              accessibilityLabel={`Log ${minutes} minutes`}
              onPress={() => {
                const session: PracticeSession = {
                  id: `${Date.now()}-${minutes}`,
                  startedAt: Date.now() - minutes * 60 * 1000,
                  durationSec: minutes * 60,
                  instrument,
                  kind: 'manual',
                };
                addSession(session)
                  .then((next) => {
                    setSessions(next);
                    setNote(`Logged ${minutes} minutes.`);
                  })
                  .catch(() => setNote('Could not save that session.'));
              }}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{minutes} min</Text>
            </Pressable>
          ))}
        </View>
      </Panel>
      <Panel>
        <Text style={styles.section}>Recent</Text>
        {sessions.length === 0 ? <Text style={styles.hint}>No sessions yet. Start the timer when you pick up the horn.</Text> : null}
        {sessions.slice(0, 8).map((session) => (
          <Text key={session.id} style={styles.recent}>
            {new Date(session.startedAt).toLocaleDateString()} · {formatMinutes(session.durationSec)} · {session.instrument === 'bb-trumpet' ? 'trumpet' : 'alto'}
          </Text>
        ))}
      </Panel>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Heatmap({ days, today }: { days: Set<string>; today: string }) {
  const cells: string[] = [];
  let cursor = today;
  for (let index = 0; index < 84; index++) {
    cells.push(cursor);
    cursor = previousDay(cursor);
  }
  cells.reverse();
  return (
    <View style={styles.heat}>
      {cells.map((day) => (
        <View key={day} style={[styles.cell, days.has(day) && styles.cellOn]} accessibilityLabel={day} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  clock: { color: colors.ink, fontFamily: serif, fontSize: 72, textAlign: 'center', fontVariant: ['tabular-nums'] },
  row: { gap: 8 },
  note: { color: colors.brass, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.raised, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line },
  statValue: { color: colors.ink, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.faint, fontSize: 12, marginTop: 2 },
  section: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 18 },
  heat: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 14, height: 14, borderRadius: 3, backgroundColor: colors.line },
  cellOn: { backgroundColor: colors.frog },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: colors.ink },
  recent: { color: colors.muted, fontSize: 14 },
});
