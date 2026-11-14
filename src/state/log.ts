import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InstrumentId } from '@/lib/pitch';

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

export async function addSession(session: PracticeSession): Promise<PracticeSession[]> {
  const existing = await loadSessions();
  const next = [session, ...existing].slice(0, 400);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
