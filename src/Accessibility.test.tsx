import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import ExperienceBoundary from './ExperienceBoundary';
import { createPortfolioI18n } from './i18n';
import { RESET_DURATION, SHUTDOWN_DURATION } from './power';
import { BOOT_DURATION } from './Rom';

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
test('readable view exposes shared content, pauses hidden input and restores the selected screen without remounting', async () => {
  await advance(BOOT_DURATION);
  await act(async () =>
    container
      .querySelectorAll<HTMLButtonElement>(
        '[data-hardware="crt"] nav button',
      )[1]
      .click(),
  );
  const hardware = container.querySelector('[data-hardware="crt"]');
  const rom = container.querySelector('[data-theme]');
  await click('[data-readable-toggle]');
  const desktop = container.querySelector('main[hidden]');
  expect(desktop?.hasAttribute('inert')).toBe(true);
  expect(document.activeElement).toBe(
    container.querySelector('main:not([hidden]) h1'),
  );
  expect(
    container.querySelector('main:not([hidden]) details')?.textContent,
  ).toContain('TRANSPORT CONTROL');
  const key = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    bubbles: true,
    cancelable: true,
  });
  await act(async () => window.dispatchEvent(key));
  expect(key.defaultPrevented).toBe(false);
  expect(rom?.getAttribute('data-screen')).toBe('projects');
  await click('[data-return-to-console]');
  expect(container.querySelector('[data-hardware="crt"]')).toBe(hardware);
  expect(container.querySelector('[data-theme]')).toBe(rom);
  expect(container.querySelector('main[hidden]')).toBeNull();
  expect(document.activeElement).toBe(
    container.querySelector('[data-hardware="crt"] [aria-current="true"]'),
  );
});
test('eject and insert move keyboard focus to the next usable physical control', async () => {
  await advance(BOOT_DURATION);
  await click('[data-console-control="power"]');
  await advance(SHUTDOWN_DURATION);
  await click('[data-cartridge-action="eject"]');
  expect(document.activeElement).toBe(
    container.querySelector('[data-cartridge-id="starfall"]'),
  );
  await click('[data-cartridge-id="nightshift"]');
  expect(document.activeElement).toBe(
    container.querySelector('[data-cartridge-action="eject"]'),
  );
  expect(
    container.querySelector('[data-cartridge-status]')?.textContent,
  ).toContain('Press POWER');
});
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
  expect(state()).toBe('booting');
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
test('runtime failures provide readable projects and real contact links instead of trapping visitors', async () => {
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
  expect(container.querySelector('details')?.textContent).toContain(
    'TRANSPORT CONTROL',
  );
  expect(container.querySelector('a[href^="mailto:"]')).not.toBeNull();
  expect(container.querySelector('[data-hardware]')).toBeNull();
});
