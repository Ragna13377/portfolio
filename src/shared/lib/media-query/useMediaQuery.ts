import { useMemo, useSyncExternalStore } from 'react';

const serverSnapshot = () => false;

export function useMediaQuery(query: string) {
  const store = useMemo(() => {
    if (typeof window === 'undefined') {
      return { getSnapshot: serverSnapshot, subscribe: () => () => {} };
    }
    const media = window.matchMedia(query);
    return {
      getSnapshot: () => media.matches,
      subscribe: (notify: () => void) => {
        media.addEventListener('change', notify);
        return () => media.removeEventListener('change', notify);
      },
    };
  }, [query]);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    serverSnapshot,
  );
}
