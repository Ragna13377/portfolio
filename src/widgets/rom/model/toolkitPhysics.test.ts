import { expect, test } from 'vitest';
import {
  advancePickup,
  advancePickups,
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

test('the menu boundary reflects a falling tile and keeps its whole square inside the stage', () => {
  const aspect = 0.93;
  const item: Pickup = { index: 0, x: 99, y: 30, vx: 8, vy: 12, bounces: 0 };
  advancePickup(item, 0.04, aspect);
  expect(item.vx).toBeLessThan(0);
  expect(item.x + TILE_HEIGHT / aspect / 2).toBeCloseTo(100);
});

test('falling tiles settle on top of each other without overlapping or drifting', () => {
  const base: Pickup = {
    index: 0,
    x: 50,
    y: FLOOR - TILE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    bounces: 2,
  };
  const middle: Pickup = {
    index: 1,
    x: 50,
    y: base.y - TILE_HEIGHT - 0.05,
    vx: 2,
    vy: 8,
    bounces: 0,
  };
  const top: Pickup = {
    index: 2,
    x: 50,
    y: middle.y - TILE_HEIGHT,
    vx: 0,
    vy: 8,
    bounces: 0,
  };
  const items = [base, middle, top];
  advancePickups(items, 0.016);
  expect(middle.vy).toBeLessThan(0);
  expect(middle.support).toBeUndefined();
  for (let frame = 0; frame < 1000; frame++) advancePickups(items, 0.016);
  expect(middle.support).toBe(base.index);
  expect(top.support).toBe(middle.index);
  expect(base.y - middle.y).toBe(TILE_HEIGHT);
  expect(middle.y - top.y).toBe(TILE_HEIGHT);
  const settled = items.map((item) => ({ ...item }));
  for (let frame = 0; frame < 200; frame++) advancePickups(items, 0.016);
  expect(items).toEqual(settled);
});

test('an off-centre impact bounces and rotates before the upper cube settles flat', () => {
  const base: Pickup = {
    index: 0,
    x: 50,
    y: FLOOR - TILE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    bounces: 2,
  };
  const falling: Pickup = {
    index: 1,
    x: 52,
    y: base.y - TILE_HEIGHT - 0.05,
    vx: 3,
    vy: 18,
    bounces: 0,
  };
  const items = [base, falling];
  advancePickups(items, 0.016);
  expect(falling.vy).toBeLessThan(-6);
  expect(falling.spin).toBeGreaterThan(0);
  advancePickups(items, 0.016);
  expect(falling.angle).toBeGreaterThan(0);
  expect(falling.y).toBeLessThan(base.y - TILE_HEIGHT);
  for (let frame = 0; frame < 1500; frame++) advancePickups(items, 0.016);
  expect(falling.bounces).toBe(2);
  expect(falling.angle).toBe(0);
  expect(falling.spin).toBe(0);
  expect(falling.support).toBe(base.index);
  expect(falling.y).toBe(base.y - TILE_HEIGHT);
});

test('collecting the base releases the entire pile and the remaining blocks settle again', () => {
  const middle: Pickup = {
    index: 1,
    x: 50,
    y: FLOOR - TILE_HEIGHT * 1.5,
    vx: 0,
    vy: 0,
    bounces: 2,
    support: 0,
  };
  const top: Pickup = {
    index: 2,
    x: 50,
    y: middle.y - TILE_HEIGHT,
    vx: 0,
    vy: 0,
    bounces: 2,
    support: 1,
  };
  const items = [middle, top];
  const oldY = middle.y;
  advancePickups(items, 0.016);
  expect(items.every((item) => item.bounces === 0 && item.vy > 0)).toBe(true);
  expect(middle.y).toBeGreaterThan(oldY);
  for (let frame = 0; frame < 1000; frame++) advancePickups(items, 0.016);
  expect(middle.y).toBe(FLOOR - TILE_HEIGHT / 2);
  expect(top.y).toBe(middle.y - TILE_HEIGHT);
  expect(top.support).toBe(middle.index);
});

test('a side collision ricochets the moving tile without pushing through the resting block', () => {
  const base: Pickup = {
    index: 0,
    x: 50,
    y: FLOOR - TILE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    bounces: 2,
  };
  const width = TILE_HEIGHT / 1.25;
  const moving: Pickup = {
    index: 1,
    x: base.x - width + 0.5,
    y: base.y,
    vx: 6,
    vy: 0,
    bounces: 0,
  };
  advancePickups([base, moving], 0.016);
  expect(moving.vx).toBeLessThan(0);
  expect(base.x).toBe(50);
  expect(base.x - moving.x).toBeCloseTo(width);
});

test('three falling blocks settle without overlap even when crowded against a wall', () => {
  const aspect = 0.93;
  const width = TILE_HEIGHT / aspect;
  for (const positions of [
    [50, 50, 50],
    [3, 4, 5],
    [96, 97, 98],
    [46, 50, 54],
  ]) {
    const items: Pickup[] = positions.map((x, index) => ({
      index,
      x,
      y: -8 - index * 12,
      vx: index % 2 ? -4 : 4,
      vy: 10,
      bounces: 0,
    }));
    for (let frame = 0; frame < 2000; frame++)
      advancePickups(items, 0.016, aspect);
    for (let first = 0; first < items.length; first++) {
      expect(items[first].bounces).toBe(2);
      expect(items[first].x - width / 2).toBeGreaterThanOrEqual(-0.001);
      expect(items[first].x + width / 2).toBeLessThanOrEqual(100.001);
      for (let second = first + 1; second < items.length; second++) {
        const separated =
          Math.abs(items[first].x - items[second].x) >= width - 0.001 ||
          Math.abs(items[first].y - items[second].y) >= TILE_HEIGHT - 0.001;
        expect(separated).toBe(true);
      }
    }
  }
});

test('collection requires horizontal and vertical overlap with the grounded hero', () => {
  const item: Pickup = { index: 0, x: 50, y: 74, vx: 0, vy: 0, bounces: 2 };
  expect(overlapsHero(item, 50)).toBe(true);
  expect(overlapsHero(item, 80)).toBe(false);
  expect(overlapsHero({ ...item, y: 20 }, 50)).toBe(false);
});
