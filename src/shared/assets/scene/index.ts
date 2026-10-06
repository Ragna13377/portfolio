import first from '../../../assets/main_sprites/hello_1.webp';
import second from '../../../assets/main_sprites/hello_2.webp';
import third from '../../../assets/main_sprites/hello_3.webp';
import fourth from '../../../assets/main_sprites/hello_4.webp';
import fifth from '../../../assets/main_sprites/hello_5.webp';
import floatingIsland from './floating-island.webp';

export { floatingIsland };
export const heroFrames = [first, second, third, fourth, fifth] as const;

let preload: Promise<boolean> | undefined;
const images: HTMLImageElement[] = [];
export function preloadMainScene() {
  preload ??= Promise.all(
    [floatingIsland, ...heroFrames].map(
      (src) =>
        new Promise<boolean>((resolve) => {
          const image = new Image();
          images.push(image);
          image.onload = () => resolve(true);
          image.onerror = () => resolve(false);
          image.src = src;
        }),
    ),
  ).then((results) => {
    const loaded = results.every(Boolean);
    if (!loaded) preload = undefined;
    return loaded;
  });
  return preload;
}
