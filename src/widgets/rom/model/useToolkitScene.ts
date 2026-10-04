import { useEffect, useRef } from 'react';
import { TOOLKIT_COLLECTIBLES } from '../../../entities/toolkit';
import { takeRandomPending } from './toolkitCollection';
import { advancePickup, overlapsHero, type Pickup } from './toolkitPhysics';

export type ToolkitMovement = {
  move: (direction: -1 | 1, held?: boolean) => void;
  release: (direction?: -1 | 1) => void;
};

export function useToolkitScene(
  enabled: boolean,
  collected: ReadonlySet<string>,
  onCollect: (id: string) => void,
  idleFrames: string[],
  runFrames: string[],
) {
  const hero = useRef<HTMLImageElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const movement = useRef({ direction: 0, until: 0 });
  const collect = useRef(onCollect);
  const alreadyCollected = useRef(collected);
  collect.current = onCollect;
  alreadyCollected.current = collected;
  const controls = useRef<ToolkitMovement>({
    move(direction, held = false) {
      movement.current = {
        direction,
        until: held ? Infinity : performance.now() + 220,
      };
    },
    release(direction) {
      if (direction === undefined || movement.current.direction === direction)
        movement.current = { direction: 0, until: 0 };
    },
  });

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let nextSpawn = 0.4;
    let heroX = 50;
    let facing = 1;
    let active: Pickup[] = [];
    const pending = TOOLKIT_COLLECTIBLES.map((_, index) => index).filter(
      (index) => !alreadyCollected.current.has(TOOLKIT_COLLECTIBLES[index].id),
    );
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const pause = () => controls.current.release();
    const stage = tiles.current[0]?.parentElement;
    const stageAspect = stage
      ? stage.clientWidth / Math.max(1, stage.clientHeight)
      : 1.25;
    const tick = (now: number) => {
      const dt = document.hidden
        ? 0
        : Math.min((now - (last || now)) / 1000, 0.04);
      last = now;
      elapsed += dt;
      const direction =
        now < movement.current.until ? movement.current.direction : 0;
      heroX = Math.max(9, Math.min(91, heroX + direction * 42 * dt));
      if (direction) facing = direction;
      if (hero.current) {
        hero.current.style.left = `${heroX}%`;
        hero.current.style.transform = `translate(-50%, 18.5%) scaleX(${facing})`;
        const frames = direction ? runFrames : idleFrames;
        const src =
          frames[
            reduced
              ? 0
              : Math.floor(elapsed / (direction ? 0.12 : 0.38)) % frames.length
          ];
        if (hero.current.getAttribute('src') !== src) hero.current.src = src;
        hero.current.dataset.moving = String(Boolean(direction));
      }
      // Count falling and resting pickups together, so the floor never piles up.
      if (elapsed >= nextSpawn && pending.length && active.length < 3) {
        const index = takeRandomPending(pending);
        if (index !== undefined)
          active.push({
            index,
            x: 10 + Math.random() * 80,
            y: -8,
            vx: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 3),
            vy: 6 + Math.random() * 12,
            bounces: 0,
          });
        nextSpawn = elapsed + 1.1 + Math.random() * 0.8;
      }
      active = active.filter((item) => {
        advancePickup(item, dt);
        const node = tiles.current[item.index];
        if (overlapsHero(item, heroX)) {
          if (node) node.hidden = true;
          collect.current(TOOLKIT_COLLECTIBLES[item.index].id);
          return false;
        }
        if (node) {
          node.hidden = false;
          node.style.left = `${item.x}%`;
          node.style.top = `${item.y}%`;
          node.dataset.falling = String(item.vy > 4 && item.bounces === 0);
          // Skew around the tile's top edge: the free end lags behind its motion.
          const trailAngle = Math.max(
            -28,
            Math.min(
              28,
              (Math.atan2(item.vx * stageAspect, Math.max(item.vy, 8)) * 180) /
                Math.PI,
            ),
          );
          node.style.setProperty('--trail-angle', `${trailAngle}deg`);
          node.style.setProperty(
            '--trail-height',
            `${Math.min(52, 26 + item.vy * 0.35)}px`,
          );
        }
        return true;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', pause);
    return () => {
      cancelAnimationFrame(frame);
      pause();
      for (const node of tiles.current) if (node) node.hidden = true;
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', pause);
    };
  }, [enabled, idleFrames, runFrames]);
  return { hero, tiles, controls };
}
