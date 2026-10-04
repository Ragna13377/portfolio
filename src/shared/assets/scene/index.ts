import cloudsForeground from './clouds-foreground.webp';
import cloudsMid from './clouds-mid.webp';
import cloudsNear from './clouds-near.webp';
import floatingIsland from './floating-island.webp';
import first from './hero-idle-01.webp';
import third from './hero-idle-03.webp';
import fourth from './hero-idle-04.webp';

export { cloudsForeground, cloudsMid, cloudsNear, floatingIsland };
export const heroFrames = [first, third, fourth] as const;

let preload: Promise<void> | undefined;
const images: HTMLImageElement[] = [];
export function preloadMainScene() {
  preload ??= Promise.all(
    [
      cloudsMid,
      cloudsNear,
      cloudsForeground,
      floatingIsland,
      ...heroFrames,
    ].map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          images.push(image);
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = src;
        }),
    ),
  ).then(() => undefined);
  return preload;
}
