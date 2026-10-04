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
  angle?: number;
  spin?: number;
};

function halfSize(item: Pickup) {
  const radians = ((item.angle ?? 0) * Math.PI) / 180;
  return (
    (TILE_HEIGHT / 2) *
    (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)))
  );
}

function rotateAfterImpact(item: Pickup, impulse: number) {
  item.spin = Math.max(-150, Math.min(150, (item.spin ?? 0) + impulse));
}

function advanceRotation(item: Pickup, dt: number) {
  if (item.angle === undefined && item.spin === undefined) return;
  // A damped rocking motion keeps icons readable and returns resting blocks flat.
  const angle = item.angle ?? 0;
  item.spin = ((item.spin ?? 0) - angle * 65 * dt) * Math.exp(-9 * dt);
  item.angle = Math.max(-22, Math.min(22, angle + item.spin * dt));
  if (Math.abs(item.angle) < 0.02 && Math.abs(item.spin) < 0.1) {
    item.angle = 0;
    item.spin = 0;
  }
}

function confinePickup(item: Pickup, stageAspect: number) {
  const inset = halfSize(item) / stageAspect;
  if (item.x < inset || item.x > 100 - inset) {
    if (item.bounces < 2) rotateAfterImpact(item, -item.vx * 12);
    item.x = Math.max(inset, Math.min(100 - inset, item.x));
    item.vx = item.x === inset ? Math.abs(item.vx) : -Math.abs(item.vx);
  }
}

export function advancePickup(item: Pickup, dt: number, stageAspect = 1.25) {
  advanceRotation(item, dt);
  if (item.bounces >= 2) {
    if (item.support === undefined) item.y = FLOOR - halfSize(item);
    confinePickup(item, stageAspect);
    return;
  }
  item.vy += 37 * dt;
  item.x += item.vx * dt;
  item.y += item.vy * dt;
  confinePickup(item, stageAspect);
  if (item.y >= FLOOR - halfSize(item)) {
    item.y = FLOOR - halfSize(item);
    rotateAfterImpact(item, item.vx * 12);
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
      item.y = support.y - halfSize(support) - halfSize(item);
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
        const contactHeight = halfSize(a) + halfSize(b);
        const overlapX = contactHeight / stageAspect - Math.abs(a.x - b.x);
        const overlapY = contactHeight - Math.abs(a.y - b.y);
        if (overlapX <= 0.001 || overlapY <= 0.001) continue;
        const upper = a.y < b.y ? a : b;
        const lower = upper === a ? b : a;
        const landedFromAbove =
          upper.vy >= 0 &&
          (previousY.get(upper.index) ?? upper.y) <=
            (previousY.get(lower.index) ?? lower.y) - contactHeight + 0.2;
        if (landedFromAbove || overlapY <= overlapX * stageAspect) {
          upper.y = lower.y - contactHeight;
          if (lower.bounces >= 2 && upper.vy >= 0) {
            if (upper.vy > 3) {
              const impact = upper.vy;
              upper.vy = -impact * 0.38;
              upper.vx *= 0.72;
              rotateAfterImpact(
                upper,
                (upper.x - lower.x) * impact * 3 + upper.vx * 10,
              );
            } else {
              upper.vx = 0;
              upper.vy = 0;
              upper.bounces = 2;
              upper.support = lower.index;
            }
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
          if (left.bounces < 2) rotateAfterImpact(left, left.vx * 10);
          if (right.bounces < 2) rotateAfterImpact(right, right.vx * 10);
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
    item.y + halfSize(item) > FLOOR - HERO_HEIGHT + 3 &&
    item.y - halfSize(item) < FLOOR
  );
}
