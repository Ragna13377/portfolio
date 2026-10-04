// Positions use percentages of the playfield. The artwork's platform is at 79%.
export const FLOOR = 79;
export const HERO_HEIGHT = 30;
export const HERO_WIDTH = 23;
export const TILE_HEIGHT = 7;
export type Pickup = {
  index: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
};

export function advancePickup(item: Pickup, dt: number) {
  if (item.bounces >= 2) return;
  item.vy += 37 * dt;
  item.x += item.vx * dt;
  item.y += item.vy * dt;
  if (item.x < 5 || item.x > 95) {
    item.x = Math.max(5, Math.min(95, item.x));
    item.vx *= -1;
  }
  if (item.y >= FLOOR - TILE_HEIGHT / 2) {
    item.y = FLOOR - TILE_HEIGHT / 2;
    item.bounces += 1;
    item.vy = item.bounces === 1 ? -12 : 0;
    if (item.bounces === 2) item.vx = 0;
  }
}

export function overlapsHero(item: Pickup, heroX: number) {
  return (
    Math.abs(item.x - heroX) < HERO_WIDTH / 2 &&
    item.y + TILE_HEIGHT / 2 > FLOOR - HERO_HEIGHT + 3 &&
    item.y - TILE_HEIGHT / 2 < FLOOR
  );
}
