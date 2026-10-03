import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
});
test('only requested worlds preload, concurrent and repeat visits reuse cache, failures retry', async () => {
  const images: {
    src: string;
    onload: null | (() => void);
    onerror: null | (() => void);
  }[] = [];
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      onload = null;
      onerror = null;
      constructor() {
        images.push(this);
      }
    },
  );
  const { preloadTheme } = await import('./themeAssets');
  const first = preloadTheme('starfall');
  expect(preloadTheme('starfall')).toBe(first);
  expect(images).toHaveLength(1);
  expect(images[0].src).toBe(
    `${import.meta.env.BASE_URL}assets/rom/lantern-trail.webp`,
  );
  images[0].onload?.();
  expect(await first).toBe(true);
  expect(await preloadTheme('starfall')).toBe(true);
  vi.resetModules();
  const { preloadTheme: loadAgain } = await import('./themeAssets');
  const second = loadAgain('starfall');
  expect(images).toHaveLength(2);
  images[1].onerror?.();
  expect(await second).toBe(false);
  const retry = loadAgain('starfall');
  expect(images).toHaveLength(3);
  images[2].onload?.();
  expect(await retry).toBe(true);
});
test('a stalled image request settles and permits retry', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      onload = null;
      onerror = null;
    },
  );
  const { preloadTheme } = await import('./themeAssets');
  const stalled = preloadTheme('starfall');
  await vi.advanceTimersByTimeAsync(4000);
  expect(await stalled).toBe(false);
  expect(preloadTheme('starfall')).not.toBe(stalled);
  await vi.advanceTimersByTimeAsync(4000);
});
