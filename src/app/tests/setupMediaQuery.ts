import { beforeEach } from 'vitest';

let desktopInput = true;
let reducedMotion = false;
export function setReducedMotionPreference(available: boolean) {
  reducedMotion = available;
  window.dispatchEvent(new Event('resize'));
}
export function setDesktopInput(available: boolean) {
  desktopInput = available;
  window.dispatchEvent(new Event('resize'));
}
beforeEach(() => {
  desktopInput = true;
  reducedMotion = false;
});

// jsdom does not implement matchMedia. Drive its change events from the same
// viewport fixtures used by the integration tests, including subscription cleanup.
window.matchMedia = (query: string): MediaQueryList => {
  const target = new EventTarget();
  const readMatches = () => {
    if (query.includes('prefers-reduced-motion')) return reducedMotion;
    const minimum = Number(query.match(/min-width:\s*(\d+)px/)?.[1] ?? 0);
    const landscape =
      !query.includes('orientation: landscape') ||
      window.innerWidth > window.innerHeight;
    const input =
      (!query.includes('any-pointer: fine') &&
        !query.includes('any-hover: hover')) ||
      desktopInput;
    return window.innerWidth >= minimum && landscape && input;
  };
  let previous = readMatches();
  const resize = () => {
    const matches = readMatches();
    if (matches === previous) return;
    previous = matches;
    target.dispatchEvent(new Event('change'));
  };
  return {
    media: query,
    get matches() {
      return readMatches();
    },
    onchange: null,
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) => {
      target.addEventListener(type, listener, options);
      window.addEventListener('resize', resize);
    },
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) => {
      target.removeEventListener(type, listener, options);
      window.removeEventListener('resize', resize);
    },
    dispatchEvent: target.dispatchEvent.bind(target),
    addListener: () => {
      throw new Error('Use the change event API');
    },
    removeListener: () => {
      throw new Error('Use the change event API');
    },
  };
};
