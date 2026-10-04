import { expect, test } from 'vitest';
import {
  advancePickup,
  FLOOR,
  overlapsHero,
  type Pickup,
  TILE_HEIGHT,
} from './toolkitPhysics';

test('pickups fall, deflect on bounce and settle without leaving the stage', () => {
  const item: Pickup = { index: 0, x: 50, y: -8, vx: 4, vy: 10, bounces: 0 };
  let bouncedX = 0;
  for (let step = 0; step < 400; step++) {
    const before = item.bounces;
    advancePickup(item, 0.016);
    if (before === 0 && item.bounces === 1) {
      expect(item.vy).toBeLessThan(0);
      bouncedX = item.x;
    }
  }
  expect(item.bounces).toBe(2);
  expect(item.y).toBe(FLOOR - TILE_HEIGHT / 2);
  expect(item.x).toBeGreaterThan(bouncedX);
  const settled = { ...item };
  advancePickup(item, 1);
  expect(item).toEqual(settled);
});

test('collection requires horizontal and vertical overlap with the grounded hero', () => {
  const item: Pickup = { index: 0, x: 50, y: 74, vx: 0, vy: 0, bounces: 2 };
  expect(overlapsHero(item, 50)).toBe(true);
  expect(overlapsHero(item, 80)).toBe(false);
  expect(overlapsHero({ ...item, y: 20 }, 50)).toBe(false);
});
