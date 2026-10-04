import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createPortfolioI18n } from '../../shared/config/i18n';
import { RESET_DURATION, SHUTDOWN_DURATION } from '../../shared/lib/power';
import { BOOT_DURATION } from '../../widgets/rom';
import App from '../App';
import ExperienceBoundary from '../providers/ExperienceBoundary';

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
let previous: boolean | undefined;
beforeEach(async () => {
  vi.useFakeTimers();
  previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('innerWidth', 1600);
  vi.stubGlobal('innerHeight', 900);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      <I18nextProvider i18n={createPortfolioI18n('en')}>
        <App />
      </I18nextProvider>,
    ),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  environment.IS_REACT_ACT_ENVIRONMENT = previous;
});
const click = async (selector: string) =>
  act(async () =>
    container.querySelector<HTMLButtonElement>(selector)?.click(),
  );
const advance = async (duration: number) =>
  act(async () => vi.advanceTimersByTime(duration));
const state = () =>
  container
    .querySelector('[data-power-state]')
    ?.getAttribute('data-power-state');
test('reset guards transitional and off states, returns to fresh menu, and preserves mounted hardware', async () => {
  const reset = container.querySelector<HTMLButtonElement>(
    '[data-console-control="reset"]',
  ) as HTMLButtonElement;
  const hardware = container.querySelector('[data-hardware="console"]');
  expect(reset.getAttribute('aria-disabled')).toBe('true');
  await advance(BOOT_DURATION);
  await act(async () =>
    container.querySelectorAll<HTMLButtonElement>('nav button')[1].click(),
  );
  await act(async () => reset.click());
  expect(state()).toBe('resetting');
  expect(reset.getAttribute('aria-disabled')).toBe('true');
  await advance(RESET_DURATION);
  expect(state()).toBe('on');
  expect(
    container.querySelector('[data-theme]')?.getAttribute('data-screen'),
  ).toBe('boot');
  await advance(BOOT_DURATION - RESET_DURATION);
  expect(state()).toBe('on');
  expect(
    container.querySelector('[data-theme]')?.getAttribute('data-screen'),
  ).toBe('main');
  expect(container.querySelector('[data-hardware="console"]')).toBe(hardware);
  await click('[data-console-control="power"]');
  expect(reset.getAttribute('aria-disabled')).toBe('true');
  await advance(SHUTDOWN_DURATION);
  expect(reset.getAttribute('aria-disabled')).toBe('true');
});
test('runtime failures show a minimal recovery message', async () => {
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  function Broken(): never {
    throw new Error('Failed renderer');
  }
  await act(async () =>
    root.render(
      <I18nextProvider i18n={createPortfolioI18n('en')}>
        <ExperienceBoundary>
          <Broken />
        </ExperienceBoundary>
      </I18nextProvider>,
    ),
  );
  expect(errorLog).toHaveBeenCalled();
  expect(container.textContent).toContain('The console could not start.');
  expect(container.querySelectorAll('details, a')).toHaveLength(0);
  expect(container.querySelector('[data-hardware]')).toBeNull();
});
