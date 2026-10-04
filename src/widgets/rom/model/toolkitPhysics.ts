// Positions use percentages of the playfield. The artwork's platform is at 79%.
export const FLOOR = 79;
export const HERO_HEIGHT = 30;
export const HERO_WIDTH = 23;
export const TILE_HEIGHT = 8.5;
export type Pickup = {
  index: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
  support?: number;
};

function confinePickup(item: Pickup, stageAspect: number) {
  const inset = TILE_HEIGHT / stageAspect / 2;
  if (item.x < inset || item.x > 100 - inset) {
    item.x = Math.max(inset, Math.min(100 - inset, item.x));
    item.vx = item.x === inset ? Math.abs(item.vx) : -Math.abs(item.vx);
  }
}

export function advancePickup(item: Pickup, dt: number, stageAspect = 1.25) {
  if (item.bounces >= 2) return;
  item.vy += 37 * dt;
  item.x += item.vx * dt;
  item.y += item.vy * dt;
  confinePickup(item, stageAspect);
  if (item.y >= FLOOR - TILE_HEIGHT / 2) {
    item.y = FLOOR - TILE_HEIGHT / 2;
    item.bounces += 1;
    item.vy = item.bounces === 1 ? -12 : 0;
    if (item.bounces === 2) item.vx = 0;
  }
}

export function advancePickups(
  items: Pickup[],
  dt: number,
  stageAspect = 1.25,
) {
  const width = TILE_HEIGHT / stageAspect;
  // Release a whole pile when its base is collected, starting with the lowest tile.
  for (const item of [...items].sort((a, b) => b.y - a.y)) {
    if (item.support === undefined) continue;
    const support = items.find((other) => other.index === item.support);
    if (
      !support ||
      support.bounces < 2 ||
      Math.abs(item.x - support.x) >= width
    ) {
      item.support = undefined;
      item.bounces = 0;
      item.vy = 0;
    } else {
      item.y = support.y - TILE_HEIGHT;
    }
  }
  const previousY = new Map(items.map((item) => [item.index, item.y]));
  for (const item of items) advancePickup(item, dt, stageAspect);
  // Three passes are enough to resolve every contact in the three-tile limit.
  for (let pass = 0; pass < 3; pass++) {
    for (let first = 0; first < items.length; first++) {
      for (let second = first + 1; second < items.length; second++) {
        const a = items[first];
        const b = items[second];
        const overlapX = width - Math.abs(a.x - b.x);
        const overlapY = TILE_HEIGHT - Math.abs(a.y - b.y);
        if (overlapX <= 0.001 || overlapY <= 0.001) continue;
        const upper = a.y < b.y ? a : b;
        const lower = upper === a ? b : a;
        const landedFromAbove =
          upper.vy >= 0 &&
          (previousY.get(upper.index) ?? upper.y) <=
            (previousY.get(lower.index) ?? lower.y) - TILE_HEIGHT + 0.2;
        if (landedFromAbove || overlapY <= overlapX * stageAspect) {
          upper.y = lower.y - TILE_HEIGHT;
          if (lower.bounces >= 2 && upper.vy >= 0) {
            upper.vx = 0;
            upper.vy = 0;
            upper.bounces = 2;
            upper.support = lower.index;
          } else {
            upper.vy = -Math.abs(upper.vy) * 0.35;
          }
        } else {
          const left = a.x < b.x ? a : b;
          const right = left === a ? b : a;
          const leftShare =
            left.bounces >= 2 && right.bounces < 2
              ? 0
              : right.bounces >= 2 && left.bounces < 2
                ? 1
                : 0.5;
          left.x -= overlapX * leftShare;
          right.x += overlapX * (1 - leftShare);
          if (left.bounces < 2) left.vx = -Math.max(2, Math.abs(left.vx) * 0.7);
          if (right.bounces < 2)
            right.vx = Math.max(2, Math.abs(right.vx) * 0.7);
          confinePickup(left, stageAspect);
          confinePickup(right, stageAspect);
        }
      }
    }
  }
}

export function overlapsHero(item: Pickup, heroX: number) {
  return (
    Math.abs(item.x - heroX) < HERO_WIDTH / 2 &&
    item.y + TILE_HEIGHT / 2 > FLOOR - HERO_HEIGHT + 3 &&
    item.y - TILE_HEIGHT / 2 < FLOOR
  );
}
