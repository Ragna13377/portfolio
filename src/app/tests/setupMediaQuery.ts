// jsdom does not implement matchMedia. Drive its change events from the same
// viewport fixtures used by the integration tests, including subscription cleanup.
window.matchMedia = (query: string): MediaQueryList => {
  const target = new EventTarget();
  const readMatches = () => {
    const minimum = Number(query.match(/min-width:\s*(\d+)px/)?.[1] ?? 0);
    const landscape =
      !query.includes('orientation: landscape') ||
      window.innerWidth > window.innerHeight;
    return window.innerWidth >= minimum && landscape;
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
