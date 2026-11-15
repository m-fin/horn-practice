import AsyncStorage from '@react-native-async-storage/async-storage';
import { createQueue } from '@/lib/queue';
import type { InstrumentId } from '@/lib/pitch';

const enqueue = createQueue();

const STORAGE_KEY = 'horn-practice.sessions.v1';

export type PracticeSession = {
  id: string;
  startedAt: number;
  durationSec: number;
  instrument: InstrumentId;
  kind: string;
};

export async function loadSessions(): Promise<PracticeSession[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PracticeSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((session) => typeof session.durationSec === 'number' && typeof session.startedAt === 'number');
  } catch {
    return [];
  }
}

export function addSession(session: PracticeSession): Promise<PracticeSession[]> {
  return enqueue(async () => {
    const existing = await loadSessions();
    const next = [session, ...existing].slice(0, 400);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  });
}
