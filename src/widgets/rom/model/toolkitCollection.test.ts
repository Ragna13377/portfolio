import { expect, test } from 'vitest';
import { takeRandomPending } from './toolkitCollection';

test('random selection uses only the remaining pool and exhausts it without duplicates', () => {
  const pending = [2, 4, 7, 9];
  const spawned = [];
  spawned.push(takeRandomPending(pending, () => 0.75));
  expect(spawned[0]).toBe(9);
  expect(pending).toEqual([2, 4, 7]);
  while (pending.length) spawned.push(takeRandomPending(pending, () => 0.5));
  expect(new Set(spawned)).toEqual(new Set([2, 4, 7, 9]));
  expect(takeRandomPending(pending)).toBeUndefined();
});
