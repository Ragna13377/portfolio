import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import { createPortfolioI18n } from './i18n';
import { SHUTDOWN_DURATION } from './power';
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  environment.IS_REACT_ACT_ENVIRONMENT = previous;
});
const button = (selector: string) =>
  container.querySelector<HTMLButtonElement>(selector) as HTMLButtonElement;
const click = async (selector: string) =>
  act(async () => button(selector).click());
const advance = async (duration: number) =>
  act(async () => vi.advanceTimersByTime(duration));
const power = '[data-console-control="power"]';
const eject = '[data-cartridge-action="eject"]';
const second = '[data-cartridge-id="nightshift"]';
const state = () =>
  container
    .querySelector('[data-power-state]')
    ?.getAttribute('data-power-state');
test('swapping is forbidden during boot, on and shutdown; a new ROM requires POWER', async () => {
  for (const phase of ['booting', 'on', 'shuttingDown']) {
    expect(state()).toBe(phase);
    expect(button(eject).disabled).toBe(true);
    expect(button(second).disabled).toBe(true);
    await click(eject);
    await click(second);
    expect(
      container.querySelector('[data-theme]')?.getAttribute('data-theme'),
    ).toBe('starfall');
    if (phase === 'booting') await advance(BOOT_DURATION);
    if (phase === 'on') await click(power);
  }
  await advance(SHUTDOWN_DURATION);
  expect(button(eject).disabled).toBe(false);
  await click(eject);
  await click(power);
  expect(state()).toBe('off');
  await click(second);
  expect(state()).toBe('off');
  expect(
    container.querySelector('[data-theme]')?.getAttribute('data-theme'),
  ).toBe('starfall');
  await click(power);
  expect(state()).toBe('booting');
  expect(
    container.querySelector('[data-theme]')?.getAttribute('data-theme'),
  ).toBe('nightshift');
  await advance(BOOT_DURATION);
  expect(state()).toBe('on');
  for (const index of [0, 1, 2, 3]) {
    await act(async () =>
      container
        .querySelectorAll<HTMLButtonElement>('[data-hardware="crt"] nav button')
        [index].click(),
    );
    expect(container.querySelector('h2')).not.toBeNull();
    await click('[data-rom-back]');
  }
});
