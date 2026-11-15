import { useEffect, useState, useSyncExternalStore } from 'react';

type Snapshot = {
  running: boolean;
  accumulatedMs: number;
  startedAt: number | null;
};

const listeners = new Set<() => void>();
let snapshot: Snapshot = { running: false, accumulatedMs: 0, startedAt: null };

function emit() {
  for (const listener of listeners) listener();
}

export function getPracticeTimer(): Snapshot {
  return snapshot;
}

export function subscribePracticeTimer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function practiceElapsed(now = Date.now()): number {
  const { running, accumulatedMs, startedAt } = snapshot;
  return accumulatedMs + (running && startedAt ? Math.max(0, now - startedAt) : 0);
}

export function startPracticeTimer() {
  if (snapshot.running) return;
  snapshot = { ...snapshot, running: true, startedAt: Date.now() };
  emit();
}

export function pausePracticeTimer() {
  if (!snapshot.running) return;
  snapshot = { running: false, accumulatedMs: practiceElapsed(), startedAt: null };
  emit();
}

export function resetPracticeTimer() {
  snapshot = { running: false, accumulatedMs: 0, startedAt: null };
  emit();
}

/** The clock lives outside the screen, so leaving for the metronome does not wipe it. */
export function usePracticeTimer() {
  const current = useSyncExternalStore(subscribePracticeTimer, getPracticeTimer, getPracticeTimer);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!current.running) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [current.running]);
  return {
    running: current.running,
    elapsedMs: practiceElapsed(current.running ? now : Date.now()),
  };
}
