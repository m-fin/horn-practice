import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeStreak, practiceCalendar, previousDay, summarize } from './streak.ts';

describe('practice streak', () => {
  it('counts today and yesterday, and keeps yesterday if today is empty', () => {
    const days = ['2026-11-12', '2026-11-13', '2026-11-14'];
    assert.equal(computeStreak(days, '2026-11-14').current, 3);
    const paused = computeStreak(['2026-11-12', '2026-11-13'], '2026-11-14');
    assert.equal(paused.current, 2);
    assert.equal(paused.practicedToday, false);
    assert.equal(computeStreak(['2026-11-10'], '2026-11-14').current, 0);
  });

  it('tracks the longest run separately from the current one', () => {
    const result = computeStreak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-14'], '2026-11-14');
    assert.equal(result.current, 1);
    assert.equal(result.longest, 3);
  });

  it('steps back one calendar day across a month boundary', () => {
    assert.equal(previousDay('2026-03-01'), '2026-02-28');
  });

  it('lines the practice grid up on Sundays and leaves the rest of this week empty', () => {
    const cells = practiceCalendar('2026-11-15', 2);
    assert.equal(cells.length, 14);
    assert.equal(cells[0]?.day, '2026-11-08');
    assert.equal(cells[7]?.day, '2026-11-15');
    assert.equal(cells[7]?.future, false);
    assert.equal(cells[8]?.future, true);
    assert.equal(cells[13]?.day, '2026-11-21');
  });

  it('sums today and the trailing week', () => {
    const now = new Date(2026, 10, 14, 18, 0, 0).getTime();
    const summary = summarize(
      [
        { startedAt: now - 60_000, durationSec: 600 },
        { startedAt: now - 2 * 24 * 3600 * 1000, durationSec: 300 },
        { startedAt: now - 10 * 24 * 3600 * 1000, durationSec: 900 },
      ],
      now,
    );
    assert.equal(summary.todaySec, 600);
    assert.equal(summary.weekSec, 900);
  });
});
