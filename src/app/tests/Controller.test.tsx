import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  createPortfolioI18n,
  LOCALE_STORAGE_KEY,
} from '../../shared/config/i18n';
import App from '../App';

const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
let previousActEnvironment: boolean | undefined;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let instance: ReturnType<typeof createPortfolioI18n>;

beforeEach(async () => {
  vi.useFakeTimers();
  localStorage.clear();
  previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('innerWidth', 1600);
  vi.stubGlobal('innerHeight', 900);
  instance = createPortfolioI18n('en');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      <I18nextProvider i18n={instance}>
        <App />
      </I18nextProvider>,
    ),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});
function button(control: string) {
  const node = container.querySelector<HTMLButtonElement>(
    `[data-controller-input="${control}"]`,
  );
  expect(node).not.toBeNull();
  return node as HTMLButtonElement;
}
async function click(control: string) {
  await act(async () => button(control).click());
}
async function boot() {
  await act(async () => vi.advanceTimersByTime(1200));
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

test('eleven native controller buttons exist during boot and become useful after normal boot', async () => {
  const controls = container.querySelectorAll(
    '[data-hardware="controller"] button',
  );
  expect(controls).toHaveLength(11);
  for (const control of [
    'up',
    'down',
    'left',
    'right',
    'a',
    'b',
    'c',
    'start',
    'x',
    'y',
    'z',
  ]) {
    expect(button(control).type).toBe('button');
    expect(button(control).getAttribute('aria-label')).toBeTruthy();
    expect(button(control).closest('[aria-hidden="true"]')).toBeNull();
    await click(control);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'BOOTING...',
    );
  }
  await act(async () => vi.advanceTimersByTime(1199));
  expect(choices()).toHaveLength(0);
  await act(async () => vi.advanceTimersByTime(1));
  expect(selected()).toBe(0);
  await click('down');
  expect(selected()).toBe(1);
  await click('a');
  expect(heading()).toBe('PROJECTS');
});

test('six-button controller mirrors confirmation, Back and Options and bounds menu-world movement', async () => {
  await boot();
  const offset = () =>
    (
      container.querySelector('[data-menu-player]') as HTMLElement
    )?.style.getPropertyValue('--offset');
  await click('right');
  expect(offset()).toBe('20');
  for (let index = 0; index < 8; index++) await click('right');
  expect(offset()).toBe('75');
  for (let index = 0; index < 8; index++) await click('left');
  expect(offset()).toBe('-45');
  expect(selected()).toBe(0);
  await click('x');
  expect(heading()).toBe('ABOUT');
  await click('y');
  expect(selected()).toBe(0);
  await click('z');
  expect(heading()).toBe('OPTIONS');
  await click('y');
  expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
});

test('D-pad selects project islands horizontally and A never opens a detail page', async () => {
  await boot();
  await click('down');
  await click('a');
  expect(heading()).toBe('PROJECTS');
  expect(selected()).toBe(0);
  await click('right');
  expect(selected()).toBe(1);
  expect(
    container
      .querySelector('[data-project-information]')
      ?.getAttribute('data-project-information'),
  ).toBe('financial-platform');
  await click('a');
  await click('x');
  expect(heading()).toBe('PROJECTS');
  expect(selected()).toBe(1);
  await click('left');
  expect(selected()).toBe(0);
  await click('left');
  expect(selected()).toBe(3);
  await click('b');
  expect(selected()).toBe(1);
  expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
});
test.each([0, 1, 2, 3])(
  'Start restores portfolio context %i and B returns Main',
  async (index) => {
    await boot();
    for (let step = 0; step < index; step++) await click('down');
    await click('a');
    if (index === 1) {
      await click('down');
      await click('a');
    }
    if (index === 2) {
      await click('right');
      expect(container.querySelector('[data-toolkit-hero]')).not.toBeNull();
    }
    const screen = container.querySelector(
      '[data-hardware="crt"]',
    )?.textContent;
    const selection = selected();
    if (index === 3) {
      await click('a');
      expect(
        container.querySelector('[data-hardware="crt"]')?.textContent,
      ).toBe(screen);
    }
    if (index === 0 || index === 3) {
      for (const control of ['up', 'down']) await click(control);
      expect(
        container.querySelector('[data-hardware="crt"]')?.textContent,
      ).toBe(screen);
    }
    await click('start');
    expect(heading()).toBe('OPTIONS');
    await click('start');
    expect(heading()).toBe('OPTIONS');
    await click('b');
    expect(container.querySelector('[data-hardware="crt"]')?.textContent).toBe(
      screen,
    );
    expect(selected()).toBe(selection);
    await click('b');
    expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
    expect(selected()).toBe(index);
  },
);

test('Options and Language share selection, confirmation, persistence and Back semantics', async () => {
  await boot();
  await click('start');
  expect(heading()).toBe('OPTIONS');
  await click('up');
  if (container.querySelector('[data-rom-back][data-rom-selected]'))
    await click('up');
  expect(selected()).toBe(1);
  await click('a');
  expect(heading()).toBe('CONTROLS');
  for (const control of ['up', 'down', 'start']) await click(control);
  expect(heading()).toBe('CONTROLS');
  await click('b');
  expect(heading()).toBe('OPTIONS');
  await click('down');
  if (container.querySelector('[data-rom-back][data-rom-selected]'))
    await click('down');
  expect(selected()).toBe(0);
  await click('a');
  expect(heading()).toBe('LANGUAGE');
  await click('up');
  if (container.querySelector('[data-rom-back][data-rom-selected]'))
    await click('up');
  expect(selected()).toBe(1);
  await click('down');
  if (container.querySelector('[data-rom-back][data-rom-selected]'))
    await click('down');
  expect(selected()).toBe(0);
  await click('down');
  expect(selected()).toBe(1);
  expect(instance.resolvedLanguage).toBe('en');
  expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
  for (const control of ['c', 'left', 'right', 'start']) await click(control);
  expect(selected()).toBe(1);
  expect(heading()).toBe('LANGUAGE');
  expect(instance.resolvedLanguage).toBe('en');
  await click('a');
  expect(instance.resolvedLanguage).toBe('ru');
  expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
  expect(button('a').getAttribute('aria-label')).toBe('A — Выбрать');
  await click('c');
  expect(instance.resolvedLanguage).toBe('ru');
  expect(selected()).toBe(1);
  await click('b');
  expect(heading()).toBe('НАСТРОЙКИ');
  await click('b');
  expect(container.querySelector('h1')).not.toBeNull();
});

test('C and horizontal inputs preserve screen, selection and locale across vertical menus', async () => {
  await boot();
  for (const open of ['main', 'projects', 'toolkit', 'options']) {
    if (open === 'projects' || open === 'toolkit') {
      await act(async () => choices()[open === 'projects' ? 1 : 2].click());
    } else if (open === 'options') await click('start');
    await click('down');
    const previous = container.querySelector(
      '[data-hardware="crt"]',
    )?.textContent;
    const index = selected();
    for (const control of ['left', 'right', 'c']) await click(control);
    expect(container.querySelector('[data-hardware="crt"]')?.textContent).toBe(
      previous,
    );
    expect(selected()).toBe(index);
    expect(instance.resolvedLanguage).toBe('en');
    await click('b');
  }
});

test('exact hardware nodes survive controller navigation and language changes', async () => {
  await boot();
  const selectors = [
    '[data-hardware="controller"]',
    '[data-hardware="crt"]',
    '[data-hardware="console"]',
    ...['a', 'b', 'start'].map(
      (control) => `[data-controller-input="${control}"]`,
    ),
  ];
  const nodes = selectors.map((selector) => container.querySelector(selector));
  for (const control of [
    'down',
    'a',
    'a',
    'b',
    'b',
    'start',
    'a',
    'down',
    'a',
    'b',
    'b',
  ])
    await click(control);
  selectors.forEach((selector, index) => {
    expect(container.querySelector(selector)).toBe(nodes[index]);
  });
});

// JSDOM has no native keyboard default action. Verify the event is left untouched,
// then model its native click; real browser verification covers the actual default.
test.each(['Enter', ' '])(
  'hardware %s stays native and dispatches once for A, B and Start',
  async (key) => {
    await boot();
    await click('down');
    for (const [control, expected] of [
      ['a', 'PROJECTS'],
      ['b', undefined],
      ['start', 'OPTIONS'],
    ] as const) {
      const node = button(control);
      await act(async () => node.focus());
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      const previous = container.querySelector(
        '[data-hardware="crt"]',
      )?.textContent;
      await act(async () => node.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false);
      expect(node.dataset.keyPressed).toBe('true');
      expect(
        container.querySelector('[data-hardware="crt"]')?.textContent,
      ).toBe(previous);
      await act(async () => {
        node.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        node.click();
      });
      expect(node.dataset.keyPressed).toBeUndefined();
      expect(heading()).toBe(expected);
      expect(document.activeElement).toBe(node);
    }
  },
);

test('keyboard resumes ROM navigation after physical input and direct CRT clicks remain coherent', async () => {
  await boot();
  await act(async () => button('down').focus());
  await click('down');
  expect(selected()).toBe(1);
  await click('a');
  await click('down');
  expect(selected()).toBe(1);
  await act(async () => choices()[2].click());
  const detail = heading();
  expect(selected()).toBe(2);
  await act(async () => button('start').focus());
  await click('start');
  const event = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    bubbles: true,
    cancelable: true,
  });
  await act(async () => button('start').dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
  expect(selected()).toBe(1);
  expect(document.activeElement).toBe(choices()[1]);
  await act(async () =>
    choices()[1].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  expect(heading()).toBe('CONTROLS');
  await click('b');
  await click('b');
  expect(heading()).toBe('PROJECTS');
  await click('a');
  expect(heading()).toBe(detail);
});
