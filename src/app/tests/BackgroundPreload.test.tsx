import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { expect, test, vi } from 'vitest';
import { createPortfolioI18n } from '../../shared/config/i18n';
import Rom from '../../widgets/rom/ui/Rom';

test('screen backgrounds wait for Main and its assets, cancel on navigation and preload once on return', async () => {
  vi.useFakeTimers();
  const environment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const images: {
    src: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    decode: ReturnType<typeof vi.fn>;
  }[] = [];
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      onload = null;
      onerror = null;
      decode = vi.fn().mockResolvedValue(undefined);
      constructor() {
        images.push(this);
      }
    },
  );
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <I18nextProvider i18n={createPortfolioI18n('en')}>
          <Rom inputEnabled onBootComplete={() => undefined} />
        </I18nextProvider>,
      ),
    );
    expect(images).toHaveLength(7);
    const mainImages = [...images];
    await act(async () => {
      for (const image of mainImages.slice(0, -1)) image.onload?.();
    });
    expect(images).toHaveLength(7);
    await act(async () => vi.advanceTimersByTime(1200));
    expect(container.querySelector('[data-screen="main"]')).not.toBeNull();
    expect(images).toHaveLength(7);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('nav button')?.click(),
    );
    expect(container.querySelector('[data-screen="about"]')).not.toBeNull();
    await act(async () => mainImages.at(-1)?.onload?.());
    expect(images).toHaveLength(7);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
    );
    expect(images).toHaveLength(12);
    expect(images.slice(7).map((image) => image.src)).toEqual([
      expect.stringContaining('about-stage-bg'),
      expect.stringContaining('project-stage-bg'),
      expect.stringContaining('toolkit-stage-bg'),
      expect.stringContaining('clouds-mid'),
      expect.stringContaining('clouds-near'),
    ]);
    for (const image of images.slice(7))
      expect(image.decode).toHaveBeenCalledOnce();
    await act(async () =>
      container.querySelector<HTMLButtonElement>('nav button')?.click(),
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
    );
    expect(images).toHaveLength(12);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
