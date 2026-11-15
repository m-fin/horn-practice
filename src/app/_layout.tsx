import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSyncExternalStore } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useConditionalKeepAwake } from '@/hooks/awake';
import { InstrumentProvider } from '@/state/instrument';
import { getPracticeTimer, subscribePracticeTimer } from '@/state/practiceTimer';
import { colors } from '@/theme';

function AwakeWhileTiming() {
  const { running } = useSyncExternalStore(subscribePracticeTimer, getPracticeTimer, getPracticeTimer);
  useConditionalKeepAwake(running, 'practice-timer');
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <InstrumentProvider>
        <AwakeWhileTiming />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.brass,
            headerTitleStyle: { color: colors.ink, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="music/index" options={{ title: 'Music stand' }} />
          <Stack.Screen name="music/[id]" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="metronome" options={{ title: 'Metronome' }} />
          <Stack.Screen name="tuner" options={{ title: 'Tuner' }} />
          <Stack.Screen name="drone" options={{ title: 'Drone' }} />
          <Stack.Screen name="exercises" options={{ title: 'Exercises' }} />
          <Stack.Screen name="timer" options={{ title: 'Practice log' }} />
          <Stack.Screen name="takes" options={{ title: 'Takes' }} />
        </Stack>
      </InstrumentProvider>
    </GestureHandlerRootView>
  );
}
