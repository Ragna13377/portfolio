import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { PROJECTS } from '../../entities/project';
import {
  createPortfolioI18n,
  LOCALE_STORAGE_KEY,
  resources,
} from '../../shared/config/i18n';
import App from '../App';

const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
let previousActEnvironment: boolean | undefined;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let instance: ReturnType<typeof createPortfolioI18n>;

beforeEach(() => {
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

async function render() {
  await act(async () =>
    root.render(
      <I18nextProvider i18n={instance}>
        <App />
      </I18nextProvider>,
    ),
  );
}
async function boot() {
  await render();
  await act(async () => vi.advanceTimersByTime(1200));
}
async function press(
  key: string,
  target: EventTarget = document.activeElement ?? window,
  modifiers: KeyboardEventInit = {},
) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}
function choices() {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('nav button'),
  );
}
async function clickChoice(index: number) {
  await act(async () => choices()[index].click());
}
async function back() {
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
  );
}
function heading() {
  return container.querySelector('h2')?.textContent;
}
function selectedIndex() {
  return choices().findIndex(
    (choice) => choice.getAttribute('aria-current') === 'true',
  );
}
function expectFocus(index: number) {
  expect(document.activeElement).toBe(choices()[index]);
}

test.each([
  'main',
  'about',
  'projects',
  'projectDetail',
  'toolkit',
  'contact',
] as const)(
  'O from %s restores exact context, selection, focus and hardware without booting',
  async (screen) => {
    await boot();
    if (screen !== 'main')
      await clickChoice(
        screen === 'about'
          ? 0
          : screen === 'projects' || screen === 'projectDetail'
            ? 1
            : screen === 'toolkit'
              ? 2
              : 3,
      );
    if (screen === 'projectDetail') await clickChoice(2);
    if (screen === 'projects') await press('ArrowDown');
    if (screen === 'toolkit') await clickChoice(3);
    if (screen === 'main') await press('ArrowUp');
    const previousHeading = container.querySelector('h1,h2')?.textContent;
    const previousIndex = selectedIndex();
    const hardware = Array.from(
      container.querySelectorAll(
        '[data-hardware], [aria-label="CRT viewport"], [aria-label="Desktop hardware scene"]',
      ),
    );
    await press('o');
    expect(heading()).toBe('OPTIONS');
    expectFocus(0);
    await press('O');
    expect(heading()).toBe('OPTIONS');
    await back();
    expect(container.querySelector('h1,h2')?.textContent).toBe(previousHeading);
    expect(selectedIndex()).toBe(previousIndex);
    if (previousIndex >= 0) expectFocus(previousIndex);
    else expect(document.activeElement).toBe(container.querySelector('h2'));
    expect(
      container.querySelector('[role="status"]')?.textContent ?? '',
    ).not.toContain('BOOTING');
    Array.from(
      container.querySelectorAll(
        '[data-hardware], [aria-label="CRT viewport"], [aria-label="Desktop hardware scene"]',
      ),
    ).forEach((node, index) => {
      expect(node).toBe(hardware[index]);
    });
    if (screen === 'projectDetail') {
      await press('Escape');
      expect(heading()).toBe('PROJECTS SELECT');
      expectFocus(2);
    }
  },
);

test('O during boot, modified O, prevented/composing events and editable/unrelated targets are protected', async () => {
  await render();
  expect((await press('O', window)).defaultPrevented).toBe(false);
  expect(container.querySelector('[role="status"]')?.textContent).toBe(
    'BOOTING...',
  );
  await act(async () => vi.advanceTimersByTime(1200));
  for (const modifiers of [
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { isComposing: true },
  ]) {
    expect((await press('o', window, modifiers)).defaultPrevented).toBe(false);
  }
  const prevented = new KeyboardEvent('keydown', {
    key: 'o',
    cancelable: true,
  });
  prevented.preventDefault();
  await act(async () => {
    window.dispatchEvent(prevented);
  });
  for (const tag of ['input', 'textarea', 'select', 'button', 'a', 'div']) {
    const target = document.createElement(tag);
    if (tag === 'div') target.setAttribute('contenteditable', 'plaintext-only');
    document.body.append(target);
    try {
      expect((await press('o', target)).defaultPrevented).toBe(false);
    } finally {
      target.remove();
    }
  }
  // Also protect a child of an editable region, including empty contenteditable.
  const editable = document.createElement('div');
  editable.setAttribute('contenteditable', '');
  editable.innerHTML = '<span>text</span>';
  container.append(editable);
  expect(
    (await press('O', editable.firstChild as HTMLElement)).defaultPrevented,
  ).toBe(false);
  editable.remove();
  expect(heading()).toBeUndefined();
  expect(choices()).toHaveLength(4);
  await press('O');
  expect(heading()).toBe('OPTIONS');
});

test('O works on a focused native Contact copy button without hijacking its other shortcuts', async () => {
  await boot();
  await clickChoice(3);
  const link = container.querySelector(
    '[aria-label="Copy Telegram handle"]',
  ) as HTMLButtonElement;
  await act(async () => link.focus());
  expect((await press('Enter', link)).defaultPrevented).toBe(false);
  await press('O', link);
  expect(heading()).toBe('OPTIONS');
  await press('Backspace');
  expect(heading()).toBe('CONTACT');
});

test('Options contains only Language/Controls, wraps with arrows and W/S, activates with Enter/Space or mouse', async () => {
  await boot();
  expect(choices().map((b) => b.textContent?.trim().replace(/^▶/, ''))).toEqual(
    ['ABOUT', 'PROJECTS', 'TOOLKIT', 'CONTACT'],
  );
  await press('O');
  expect(choices().map((b) => b.textContent?.trim().replace(/^▶/, ''))).toEqual(
    ['LANGUAGE', 'CONTROLS'],
  );
  for (const [key, index] of [
    ['ArrowUp', 1],
    ['ArrowDown', 0],
    ['W', 1],
    ['S', 0],
    ['s', 1],
    ['w', 0],
  ] as const) {
    if (index === 1 && ['ArrowUp', 'W'].includes(key)) {
      await press(key);
      expect(document.activeElement).toBe(
        container.querySelector('[data-rom-back]'),
      );
    }
    await press(key);
    if (document.activeElement?.hasAttribute('data-rom-back')) await press(key);
    expect(selectedIndex()).toBe(index);
    expectFocus(index);
  }
  await press('Enter');
  expect(heading()).toBe('LANGUAGE');
  expectFocus(0);
  await press('O');
  expect(heading()).toBe('LANGUAGE');
  await press('Escape');
  expect(heading()).toBe('OPTIONS');
  expectFocus(0);
  await press('ArrowDown');
  await press(' ');
  expect(heading()).toBe('CONTROLS');
  expect(document.activeElement).toBe(container.querySelector('h2'));
  await press('o');
  expect(heading()).toBe('CONTROLS');
  await press('Backspace');
  expectFocus(1);
  await clickChoice(0);
  expect(heading()).toBe('LANGUAGE');
  await back();
  expectFocus(0);
  await clickChoice(1);
  expect(heading()).toBe('CONTROLS');
  await back();
  expectFocus(1);
  const backButton = container.querySelector(
    '[data-rom-back]',
  ) as HTMLButtonElement;
  await act(async () => backButton.focus());
  expect((await press('Enter', backButton)).defaultPrevented).toBe(false);
  expect((await press(' ', backButton)).defaultPrevented).toBe(false);
  expect((await press('Tab', backButton)).defaultPrevented).toBe(false);
  await back();
  expect(choices()).toHaveLength(4);
});

test('Language tracks active locale separately from cursor, changes immediately, persists and restores on fresh startup', async () => {
  await boot();
  await press('o');
  await clickChoice(0);
  expect(choices()).toHaveLength(2);
  expect(choices()[0].textContent).toContain('ENGLISH');
  expect(choices()[1].textContent).toContain('RUSSIAN');
  expect(choices()[0].getAttribute('aria-pressed')).toBe('true');
  for (const [key, index] of [
    ['ArrowUp', 1],
    ['ArrowDown', 0],
    ['W', 1],
    ['S', 0],
    ['s', 1],
  ] as const) {
    if (index === 1 && ['ArrowUp', 'W'].includes(key)) {
      await press(key);
      expect(document.activeElement).toBe(
        container.querySelector('[data-rom-back]'),
      );
    }
    await press(key);
    if (document.activeElement?.hasAttribute('data-rom-back')) await press(key);
    expectFocus(index);
  }
  expect(choices()[0].getAttribute('aria-pressed')).toBe('true');
  await press(' ');
  expect(instance.resolvedLanguage).toBe('ru');
  expect(heading()).toBe('ЯЗЫК');
  expect(choices()[1].getAttribute('aria-pressed')).toBe('true');
  expectFocus(1);
  expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
  await back();
  expect(heading()).toBe('НАСТРОЙКИ');
  await clickChoice(0);
  expectFocus(1);
  await clickChoice(0);
  expect(heading()).toBe('LANGUAGE');
  expectFocus(0);
  expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  await clickChoice(1);
  await act(async () => root.unmount());
  root = createRoot(container);
  vi.stubGlobal('navigator', { language: 'en-US' });
  instance = createPortfolioI18n();
  await boot();
  expect(instance.resolvedLanguage).toBe('ru');
  expect(choices()[0].textContent).toContain('ОБО МНЕ');
  await press('o');
  await clickChoice(0);
  expectFocus(1);
  await press('w');
  await press('Enter');
  expect(heading()).toBe('LANGUAGE');
  expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  expect(createPortfolioI18n().resolvedLanguage).toBe('en');
});

test('language selection remains usable when localStorage writes throw', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  await boot();
  await press('o');
  await clickChoice(0);
  await clickChoice(1);
  expect(heading()).toBe('ЯЗЫК');
  await back();
  await back();
  expect(choices()[0].textContent).toContain('ОБО МНЕ');
});

test('hardware survives Main → Options → Language → change locale → Options → Controls → Options → Main', async () => {
  await boot();
  const selector =
    '[data-hardware], [aria-label="CRT viewport"], [aria-label="Desktop hardware scene"], [data-cartridge-position="reserved"]';
  const hardware = Array.from(container.querySelectorAll(selector));
  const assertHardware = () => {
    const nodes = Array.from(container.querySelectorAll(selector));
    expect(nodes).toHaveLength(hardware.length);
    nodes.forEach((node, index) => {
      expect(node).toBe(hardware[index]);
    });
    expect(
      container.querySelector('[aria-label="CRT viewport"]')?.textContent,
    ).not.toMatch(/BOOTING|ЗАГРУЗКА/);
    expect(
      container
        .querySelector('[data-hardware="controller"]')
        ?.querySelectorAll('button'),
    ).toHaveLength(11);
  };
  await press('O');
  assertHardware();
  await clickChoice(0);
  assertHardware();
  await clickChoice(1);
  assertHardware();
  await back();
  assertHardware();
  await clickChoice(1);
  assertHardware();
  await back();
  assertHardware();
  await back();
  assertHardware();
  expect(choices()).toHaveLength(4);
});

test('Controls documents actual keyboard/mouse support in both languages without remapping or physical gamepad claims', async () => {
  await boot();
  await press('o');
  await clickChoice(1);
  for (const locale of ['en', 'ru'] as const) {
    await act(async () => {
      await instance.changeLanguage(locale);
    });
    expect(
      container.querySelectorAll('[aria-label="CRT viewport"] dt'),
    ).toHaveLength(5);
    for (const control of [
      'navigation',
      'confirm',
      'back',
      'options',
      'mouse',
    ] as const) {
      expect(container.textContent).toContain(
        resources[locale].options[control],
      );
      expect(container.textContent).toContain(
        resources[locale].options[`${control}Keys`],
      );
    }
    expect(container.querySelectorAll('input,select')).toHaveLength(0);
    expect(
      container.querySelector('[aria-label="CRT viewport"]')?.textContent,
    ).not.toMatch(/Start|gamepad|controller|геймпад/i);
  }
  await back();
  expect(heading()).toBe('НАСТРОЙКИ');
  expectFocus(1);
});

test('all portfolio namespaces translate through Options while project IDs, technology and contact literals stay stable', async () => {
  const clipboard = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', {
    language: 'en-US',
    clipboard: { writeText: clipboard },
  });
  await boot();
  await clickChoice(0);
  expect(container.textContent).toContain(resources.en.about.work);
  await press('o');
  await clickChoice(0);
  await clickChoice(1);
  await back();
  await back();
  expect(heading()).toBe('ОБО МНЕ');
  expect(container.textContent).toContain(resources.ru.about.role);
  expect(container.textContent).toContain(resources.ru.about.education);
  expect(container.textContent).toContain(resources.ru.about.work);
  expect(container.textContent).toContain(resources.ru.about.interests);
  expect(container.textContent).toContain('Ivan Dmitrievich');
  await back();
  expect(choices()[1].textContent).toContain('ПРОЕКТЫ');
  await clickChoice(1);
  expect(heading()).toBe('ВЫБОР ПРОЕКТА');
  for (let index = 0; index < PROJECTS.length; index++) {
    await clickChoice(index);
    const project = PROJECTS[index];
    const copy = resources.ru.projects[project.id];
    expect(heading()).toBe(copy.label);
    expect(container.textContent).toContain(copy.type);
    expect(
      Array.from(container.querySelectorAll('li'), (li) => li.textContent),
    ).toEqual(Object.values(copy.highlights));
    expect(container.textContent).toContain(project.tech);
    await back();
  }
  await back();
  await clickChoice(2);
  await clickChoice(4);
  expect(heading()).toBe('ИНСТРУМЕНТЫ');
  expect(choices()[4].textContent).toContain('РАЗРАБОТКА');
  expect(container.textContent).toContain('Docker');
  expect(container.textContent).toContain('Prisma');
  await press('o');
  await clickChoice(0);
  await clickChoice(0);
  await back();
  await back();
  expect(heading()).toBe('TOOLKIT');
  expectFocus(4);
  await back();
  await clickChoice(3);
  const links = Array.from(container.querySelectorAll('a'), (a) => a.href);
  await press('o');
  await clickChoice(0);
  await clickChoice(1);
  await back();
  await back();
  expect(heading()).toBe('КОНТАКТЫ');
  expect(container.textContent).toContain('ПОЧТА');
  expect(container.textContent).not.toContain('Открыть');
  expect(container.textContent).toContain('Копировать');
  for (const literal of [
    '@vedal988',
    'Ragna13377',
    'koseki.bijou987@gmail.com',
  ])
    expect(container.textContent).not.toContain(literal);
  expect(Array.from(container.querySelectorAll('a'), (a) => a.href)).toEqual(
    links,
  );
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('[aria-label="Копировать адрес почты"]')
      ?.click(),
  );
  expect(clipboard).toHaveBeenCalledWith('koseki.bijou987@gmail.com');
  expect(container.querySelector('[role="status"]')?.textContent).toBe(
    'СКОПИРОВАНО!',
  );
});

test('unsupported viewport fallback uses active locale without duplicating portfolio content', async () => {
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
  await act(async () => {
    await instance.changeLanguage('ru');
  });
  await render();
  expect(container.textContent).toContain(resources.ru.common.fallback);
  expect(container.textContent).toContain(resources.ru.about.role);
  expect(container.querySelectorAll('button, details, a')).toHaveLength(0);
  expect(container.querySelector('[data-hardware]')).toBeNull();
});
