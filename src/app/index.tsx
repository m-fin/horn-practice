import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Card, InstrumentSwitch, Screen } from '@/components/ui';
import { formatMinutes, summarize } from '@/lib/streak';
import { loadSessions } from '@/state/log';
import { colors, serif } from '@/theme';

export default function HomeScreen() {
  const [today, setToday] = useState('0 min');
  const [week, setWeek] = useState('0 min');
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSessions()
        .then((sessions) => {
          if (!active) return;
          const summary = summarize(sessions, Date.now());
          setToday(formatMinutes(summary.todaySec));
          setWeek(formatMinutes(summary.weekSec));
          setStreak(summary.streak.current);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require('../../assets/images/icon.png')} style={styles.mark} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kicker}>Horn practice</Text>
          <Text style={styles.title}>For Frog Finley</Text>
          <Text style={styles.lede}>Alto sax and trumpet. Original charts, a steady click, and a take you can send.</Text>
        </View>
      </View>
      <InstrumentSwitch />
      <View style={styles.stats}>
        <Stat label="Streak" value={streak === 1 ? '1 day' : `${streak} days`} />
        <Stat label="Today" value={today} />
        <Stat label="7 days" value={week} />
      </View>
      <Card href="/music" title="Music stand" body="Landscape pages of Frog's originals. Tap, swipe, or let it scroll." />
      <Card href="/metronome" title="Metronome" body="Tempo 30–300, tap tempo, accents, and a drift-free click." />
      <Card href="/tuner" title="Tuner" body="Microphone pitch, written for Bb trumpet or Eb alto." />
      <Card href="/drone" title="Drone" body="A sustained tone on the written note, with an optional fifth." />
      <Card href="/exercises" title="Exercises" body="Scales and long tones generated for this app. Nothing copied." />
      <Card href="/timer" title="Timer and streak" body="Keep the minutes, and the days you showed up." />
      <Card href="/takes" title="Record a take" body="Play it back, then send it for the weekly sonicrift recording." />
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

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  mark: { width: 84, height: 84, borderRadius: 22 },
  kicker: { color: colors.brass, letterSpacing: 1.2, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.ink, fontFamily: serif, fontSize: 32, lineHeight: 36 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.faint, fontSize: 12, marginTop: 2 },
});
