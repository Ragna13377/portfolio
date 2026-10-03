import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import { createPortfolioI18n, LOCALE_STORAGE_KEY } from './i18n';
import { SHUTDOWN_DURATION } from './power';
import { BOOT_DURATION } from './Rom';

const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
let previousActEnvironment: boolean | undefined;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(async () => {
  vi.useFakeTimers();
  localStorage.clear();
  previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
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
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

function power() {
  const button = container.querySelector<HTMLButtonElement>(
    '[data-console-control="power"]',
  );
  expect(button).not.toBeNull();
  return button as HTMLButtonElement;
}
function powerState() {
  return container
    .querySelector('[data-power-state]')
    ?.getAttribute('data-power-state');
}
async function advance(duration: number) {
  await act(async () => vi.advanceTimersByTime(duration));
}
async function toggle() {
  await act(async () => power().click());
}
function choices() {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '[data-hardware="crt"] nav button',
    ),
  );
}
function selected() {
  return choices().findIndex(
    (node) => node.getAttribute('aria-current') === 'true',
  );
}
function heading() {
  return container.querySelector('h2')?.textContent;
}
async function choice(index: number) {
  await act(async () => choices()[index].click());
}
function control(id: string) {
  return container.querySelector<HTMLButtonElement>(
    `[data-controller-input="${id}"]`,
  ) as HTMLButtonElement;
}
async function clickControl(id: string) {
  await act(async () => control(id).click());
}
async function press(
  key: string,
  target: EventTarget = window,
  type = 'keydown',
) {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
  });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}
async function cycle() {
  await toggle();
  await advance(SHUTDOWN_DURATION);
  await toggle();
  await advance(BOOT_DURATION);
}

test('hardware boots automatically and Power during boot is a no-op, without extending boot', async () => {
  expect(container.querySelector('[data-hardware="console"]')).not.toBeNull();
  expect(power().closest('[data-hardware="console"]')).not.toBeNull();
  expect(power().type).toBe('button');
  expect(power().getAttribute('aria-label')).toBeTruthy();
  expect(powerState()).toBe('booting');
  await advance(BOOT_DURATION / 2);
  await toggle();
  await advance(BOOT_DURATION / 2 - 1);
  expect(powerState()).toBe('booting');
  expect(container.querySelector('[role="status"]')?.textContent).toBe(
    'BOOTING...',
  );
  await advance(1);
  expect(powerState()).toBe('on');
  expect(
    container.querySelector('nav button')?.getAttribute('aria-current'),
  ).toBe('true');
});

test('deterministic shutdown and fresh wake preserve exact hardware and ROM root identity', async () => {
  const selector =
    '[data-power-state], [data-hardware], [aria-label="CRT viewport"], [data-console-control], [data-controller-input], [data-cartridge-position]';
  const hardware = Array.from(container.querySelectorAll(selector));
  const viewport = container.querySelector(
    '[aria-label="CRT viewport"]',
  ) as HTMLElement;
  const rom = viewport.firstElementChild?.firstElementChild;
  await advance(BOOT_DURATION);
  await act(async () => power().focus());
  await toggle();
  expect(powerState()).toBe('shuttingDown');
  expect(viewport.querySelector('[inert]')).not.toBeNull();
  await advance(SHUTDOWN_DURATION / 2);
  const timers = vi.getTimerCount();
  await toggle();
  expect(vi.getTimerCount()).toBe(timers);
  await advance(SHUTDOWN_DURATION / 2 - 1);
  expect(powerState()).toBe('shuttingDown');
  await advance(1);
  expect(powerState()).toBe('off');
  expect(viewport.querySelector('nav')).not.toBeNull();
  expect(document.activeElement).toBe(power());
  await toggle();
  expect(powerState()).toBe('booting');
  expect(viewport.textContent).toContain('BOOTING...');
  expect(choices()).toHaveLength(0);
  await advance(BOOT_DURATION / 2);
  await toggle();
  await advance(BOOT_DURATION / 2 - 1);
  expect(powerState()).toBe('booting');
  await advance(1);
  expect(powerState()).toBe('on');
  expect(selected()).toBe(0);
  expect(document.activeElement).toBe(power());
  expect(viewport.querySelector('[inert]')).toBeNull();
  const after = Array.from(container.querySelectorAll(selector));
  expect(after).toHaveLength(hardware.length);
  after.forEach((node, index) => {
    expect(node).toBe(hardware[index]);
  });
  expect(viewport.firstElementChild?.firstElementChild).toBe(rom);
});

test('deep ROM state stays dormant for all keyboard/controller/direct input during shutdown and off', async () => {
  await advance(BOOT_DURATION);
  await choice(1);
  await choice(2);
  const oldHeading = heading();
  const oldRom = container.querySelector(
    '[aria-label="CRT viewport"]',
  )?.textContent;
  await toggle();
  for (const state of ['shuttingDown', 'off']) {
    expect(powerState()).toBe(state);
    for (const key of [
      'ArrowUp',
      'ArrowDown',
      'W',
      'S',
      'Enter',
      ' ',
      'Escape',
      'Backspace',
      'O',
      'Tab',
      'x',
    ]) {
      expect((await press(key)).defaultPrevented).toBe(false);
    }
    for (const id of ['up', 'down', 'left', 'right', 'a', 'b', 'c', 'start']) {
      expect(control(id).disabled).toBe(false);
      await clickControl(id);
    }
    const back = container.querySelector<HTMLButtonElement>(
      '[data-rom-back]',
    ) as HTMLButtonElement;
    await act(async () => back.click());
    expect(heading()).toBe(oldHeading);
    expect(
      container.querySelector('[aria-label="CRT viewport"]')?.textContent,
    ).toBe(oldRom);
    if (state === 'shuttingDown') await advance(SHUTDOWN_DURATION);
  }
  await act(async () => control('a').focus());
  await press(' ', control('a'));
  expect(control('a').hasAttribute('data-key-pressed')).toBe(true);
  await press(' ', control('a'), 'keyup');
  expect(control('a').hasAttribute('data-key-pressed')).toBe(false);
  await toggle();
  expect(powerState()).toBe('booting');
  for (const key of ['ArrowDown', 'Enter', 'O'])
    expect((await press(key)).defaultPrevented).toBe(false);
  await clickControl('start');
  await advance(BOOT_DURATION);
  expect(powerState()).toBe('on');
  expect(heading()).toBeUndefined();
  expect(selected()).toBe(0);
  await choice(1);
  expect(selected()).toBe(0);
  await clickControl('a');
  expect(heading()).not.toBe(oldHeading);
});

test('fresh boots discard Main, Projects, Toolkit, Options selections and previous Options context', async () => {
  await advance(BOOT_DURATION);
  await choice(1);
  await choice(2);
  await clickControl('b');
  await clickControl('b');
  await choice(2);
  await choice(3);
  await clickControl('start');
  await clickControl('down');
  expect(selected()).toBe(1);
  await cycle();
  expect(selected()).toBe(0);
  await choice(1);
  expect(selected()).toBe(0);
  await clickControl('b');
  await choice(2);
  expect(selected()).toBe(0);
  await clickControl('start');
  expect(selected()).toBe(0);
  await cycle();
  await clickControl('start');
  await clickControl('b');
  expect(heading()).toBeUndefined();
  expect(selected()).toBe(0);
});

test.each(['toolkit', 'contact', 'options', 'language'] as const)(
  'wake from %s reaches fresh Main and preserves persisted Russian',
  async (screen) => {
    await advance(BOOT_DURATION);
    await clickControl('start');
    await choice(0);
    await choice(1);
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
    if (screen !== 'language') await clickControl('b');
    if (screen === 'toolkit' || screen === 'contact') {
      await clickControl('b');
      await choice(screen === 'toolkit' ? 2 : 3);
    }
    expect(power().getAttribute('aria-label')).toContain('Питание');
    await toggle();
    await advance(SHUTDOWN_DURATION);
    const blocked = container.querySelector<HTMLButtonElement>(
      '[data-rom-back]',
    ) as HTMLButtonElement;
    await act(async () => blocked.click());
    if (screen === 'language') await choice(0);
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
    await toggle();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'ЗАГРУЗКА...',
    );
    await advance(BOOT_DURATION);
    expect(choices()[0].textContent).toContain('ОБО МНЕ');
    expect(selected()).toBe(0);
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
  },
);

test.each(['Enter', ' '])(
  'Power keeps native %s activation and tactile keyboard feedback without ROM double handling',
  async (key) => {
    await advance(BOOT_DURATION);
    await act(async () => power().focus());
    expect((await press(key, power())).defaultPrevented).toBe(false);
    expect(power().hasAttribute('data-key-pressed')).toBe(true);
    expect(powerState()).toBe('on');
    expect(selected()).toBe(0);
    // jsdom does not synthesize native clicks from keyboard events; the browser check covers that.
    await toggle();
    await press(key, power(), 'keyup');
    expect(power().hasAttribute('data-key-pressed')).toBe(false);
    expect(powerState()).toBe('shuttingDown');
    await advance(SHUTDOWN_DURATION);
    expect((await press(key, power())).defaultPrevented).toBe(false);
    await toggle();
    await press(key, power(), 'keyup');
    expect(powerState()).toBe('booting');
    await advance(BOOT_DURATION);
    expect(document.activeElement).toBe(power());
    expect(selected()).toBe(0);
  },
);

test('unmount cancels shutdown without leaving a pending lifecycle timer', async () => {
  await advance(BOOT_DURATION);
  const schedule = vi.spyOn(window, 'setTimeout');
  const cancel = vi.spyOn(window, 'clearTimeout');
  await toggle();
  const index = schedule.mock.calls.findIndex(
    (call) => call[1] === SHUTDOWN_DURATION,
  );
  expect(index).toBeGreaterThanOrEqual(0);
  const timer = schedule.mock.results[index].value;
  await act(async () => root.unmount());
  expect(cancel).toHaveBeenCalledWith(timer);
  root = createRoot(container);
});
