import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InstrumentSwitch, Panel, PrimaryButton, Screen } from '@/components/ui';
import { formatClock, formatMinutes, localDayKey, practiceCalendar, summarize } from '@/lib/streak';
import { addSession, loadSessions, type PracticeSession } from '@/state/log';
import { pausePracticeTimer, resetPracticeTimer, startPracticeTimer, usePracticeTimer } from '@/state/practiceTimer';
import { useInstrument } from '@/state/instrument';
import { colors, serif } from '@/theme';

const QUICK_MINUTES = [10, 15, 20, 30, 45, 60];

export default function TimerScreen() {
  const { instrument } = useInstrument();
  const { running, elapsedMs } = usePracticeTimer();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [note, setNote] = useState('');
  const saving = useRef(false);

  useEffect(() => {
    loadSessions().then(setSessions).catch(() => undefined);
  }, []);

  const summary = summarize(sessions, Date.now());
  const practiced = new Set(sessions.map((session) => localDayKey(session.startedAt)));

  return (
    <Screen>
      <Text style={styles.clock}>{formatClock(elapsedMs)}</Text>
      <InstrumentSwitch />
      <View style={styles.row}>
        <PrimaryButton
          label={running ? 'Pause' : elapsedMs > 0 ? 'Resume' : 'Start'}
          onPress={() => {
            if (running) {
              pausePracticeTimer();
              return;
            }
            startPracticeTimer();
            if (elapsedMs === 0) setNote('');
          }}
        />
      </View>
      <PrimaryButton
        label="Save session"
        tone="frog"
        onPress={() => {
          if (saving.current) return;
          const durationSec = Math.round(elapsedMs / 1000);
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
          saving.current = true;
          addSession(session)
            .then((next) => {
              setSessions(next);
              resetPracticeTimer();
              setNote(`Logged ${formatMinutes(durationSec)}.`);
            })
            .catch(() => setNote('Could not save that session.'))
            .finally(() => {
              saving.current = false;
            });
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
        <Text style={styles.hint}>
          A day counts once you save a session. The clock keeps running if you open the metronome, and the screen stays awake while it runs.
        </Text>
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
                if (saving.current) return;
                const session: PracticeSession = {
                  id: `${Date.now()}-${minutes}`,
                  startedAt: Date.now() - minutes * 60 * 1000,
                  durationSec: minutes * 60,
                  instrument,
                  kind: 'manual',
                };
                saving.current = true;
                addSession(session)
                  .then((next) => {
                    setSessions(next);
                    setNote(`Logged ${minutes} minutes.`);
                  })
                  .catch(() => setNote('Could not save that session.'))
                  .finally(() => {
                    saving.current = false;
                  });
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
  const cells = practiceCalendar(today, 12);
  return (
    <View style={styles.calendar}>
      <View style={styles.weekdays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.heat}>
        {cells.map((cell) => (
          <View
            key={cell.day}
            accessibilityLabel={days.has(cell.day) ? `${cell.day}, practiced` : cell.day}
            style={[styles.cell, cell.future && styles.cellFuture, !cell.future && days.has(cell.day) && styles.cellOn]}
          />
        ))}
      </View>
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
  calendar: { gap: 4 },
  weekdays: { flexDirection: 'row', gap: 4, width: 22 * 7 + 4 * 6 },
  weekday: { width: 22, textAlign: 'center', color: colors.faint, fontSize: 10 },
  heat: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: 22 * 7 + 4 * 6 },
  cell: { width: 22, height: 22, borderRadius: 4, backgroundColor: colors.line },
  cellOn: { backgroundColor: colors.frog },
  cellFuture: { opacity: 0.28 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: colors.ink },
  recent: { color: colors.muted, fontSize: 14 },
});
