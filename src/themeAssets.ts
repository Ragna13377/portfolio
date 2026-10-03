import type { CartridgeId } from './cartridges';

export const themeAssetUrl = (id: CartridgeId) =>
  `${import.meta.env.BASE_URL}assets/rom/${id}-world.webp`;

// Only powered ROMs request a world. Successful requests stay decoded in memory;
// HTTP caching handles revisits across sessions. Failed requests may be retried.
const visited = new Map<CartridgeId, Promise<boolean>>();
const decoded = new Map<CartridgeId, HTMLImageElement>();
export function preloadTheme(id: CartridgeId): Promise<boolean> {
  const cached = visited.get(id);
  if (cached) return cached;
  const request = new Promise<boolean>((resolve) => {
    const img = new Image();
    const timeout = window.setTimeout(() => finish(false), 4000);
    const finish = (ok: boolean) => {
      window.clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      if (!ok) visited.delete(id);
      else decoded.set(id, img);
      resolve(ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = themeAssetUrl(id);
  });
  visited.set(id, request);
  return request;
}
