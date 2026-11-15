import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createQueue } from './queue.ts';

describe('createQueue', () => {
  it('runs jobs in order even when the first one is slower', async () => {
    const enqueue = createQueue();
    const order: string[] = [];
    const first = enqueue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push('first');
    });
    const second = enqueue(async () => {
      order.push('second');
    });
    await Promise.all([first, second]);
    assert.deepEqual(order, ['first', 'second']);
  });
});
