import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { createQueue } from '@/lib/queue';
import type { InstrumentId } from '@/lib/pitch';

const enqueue = createQueue();

const STORAGE_KEY = 'horn-practice.takes.v1';

export type Take = {
  id: string;
  uri: string;
  createdAt: number;
  instrument: InstrumentId;
  durationMillis: number;
  note: string;
};

export async function loadTakes(): Promise<Take[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Take[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persist(takes: Take[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(takes));
}

export function saveTake(input: Omit<Take, 'uri'> & { sourceUri: string }): Promise<Take[]> {
  return enqueue(() => writeTake(input));
}

async function writeTake(input: Omit<Take, 'uri'> & { sourceUri: string }): Promise<Take[]> {
  let uri = input.sourceUri;
  if (Platform.OS !== 'web' && uri) {
    const directory = new Directory(Paths.document, 'takes');
    if (!directory.exists) directory.create();
    const extension = uri.split('.').pop()?.split('?')[0] || 'm4a';
    const destination = new File(directory, `${input.id}.${extension}`);
    const source = new File(uri);
    if (source.exists) {
      await source.copy(destination);
      uri = destination.uri;
    }
  }
  const take: Take = {
    id: input.id,
    uri,
    createdAt: input.createdAt,
    instrument: input.instrument,
    durationMillis: input.durationMillis,
    note: input.note,
  };
  const next = [take, ...(await loadTakes())];
  await persist(next);
  return next;
}

export function deleteTake(id: string): Promise<Take[]> {
  return enqueue(async () => {
    const existing = await loadTakes();
    const target = existing.find((take) => take.id === id);
    if (target && Platform.OS === 'web' && target.uri.startsWith('blob:')) {
      URL.revokeObjectURL(target.uri);
    }
    if (target && Platform.OS !== 'web') {
      try {
        const file = new File(target.uri);
        if (file.exists) file.delete();
      } catch {
        // The list update still removes the row.
      }
    }
    const next = existing.filter((take) => take.id !== id);
    await persist(next);
    return next;
  });
}

export function renameTake(id: string, note: string): Promise<Take[]> {
  return enqueue(async () => {
    const next = (await loadTakes()).map((take) => (take.id === id ? { ...take, note } : take));
    await persist(next);
    return next;
  });
}
