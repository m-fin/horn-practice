export type SessionLike = {
  startedAt: number;
  durationSec: number;
};

export function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDay(iso: string, delta: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function previousDay(iso: string): string {
  return shiftDay(iso, -1);
}

export function nextDay(iso: string): string {
  return shiftDay(iso, 1);
}

export type CalendarCell = { day: string; future: boolean };

/** Sunday-start weeks, through the Saturday of the week that contains `today`. */
export function practiceCalendar(today: string, weeks = 12): CalendarCell[] {
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  const daysAfterToday = 6 - date.getUTCDay();
  const total = Math.max(1, weeks) * 7;
  const todayIndex = total - 1 - daysAfterToday;
  let cursor = today;
  for (let index = 0; index < todayIndex; index++) cursor = previousDay(cursor);
  const cells: CalendarCell[] = [];
  for (let index = 0; index < total; index++) {
    cells.push({ day: cursor, future: index > todayIndex });
    cursor = nextDay(cursor);
  }
  return cells;
}

export function computeStreak(days: string[], today: string): {
  current: number;
  longest: number;
  practicedToday: boolean;
} {
  const unique = new Set(days);
  const practicedToday = unique.has(today);
  const sorted = [...unique].sort();
  let longest = 0;
  let run = 0;
  let previous = '';
  for (const day of sorted) {
    run = previous && previousDay(day) === previous ? run + 1 : 1;
    previous = day;
    if (run > longest) longest = run;
  }
  let current = 0;
  let cursor = practicedToday ? today : previousDay(today);
  while (unique.has(cursor)) {
    current += 1;
    cursor = previousDay(cursor);
  }
  return { current, longest, practicedToday };
}

export function summarize(sessions: SessionLike[], now: number) {
  const today = localDayKey(now);
  const days = sessions.map((session) => localDayKey(session.startedAt));
  const streak = computeStreak(days, today);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekSec = sessions
    .filter((session) => session.startedAt >= weekAgo)
    .reduce((sum, session) => sum + session.durationSec, 0);
  const todaySec = sessions
    .filter((session) => localDayKey(session.startedAt) === today)
    .reduce((sum, session) => sum + session.durationSec, 0);
  return { streak, weekSec, todaySec, today };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}
