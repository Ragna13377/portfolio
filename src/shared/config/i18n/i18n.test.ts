import { afterEach, expect, test, vi } from 'vitest';
import {
  createPortfolioI18n,
  LOCALE_STORAGE_KEY,
  persistLocale,
  readInitialLocale,
  resources,
} from './i18n';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

test.each([
  [null, 'ru', 'ru'],
  [null, 'ru-RU', 'ru'],
  [null, 'ru-BY', 'ru'],
  [null, 'en-US', 'en'],
  [null, 'sv-SE', 'en'],
  [null, 'de-DE', 'en'],
  ['en', 'ru-RU', 'en'],
  ['ru', 'en-US', 'ru'],
  ['invalid', 'ru-RU', 'ru'],
  ['RU', 'en-US', 'en'],
  ['', 'ru-RU', 'ru'],
] as const)(
  'stored %s and browser %s initialize as %s',
  (stored, language, expected) => {
    localStorage.clear();
    if (stored !== null) localStorage.setItem(LOCALE_STORAGE_KEY, stored);
    vi.stubGlobal('navigator', { language });
    expect(readInitialLocale()).toBe(expected);
    const instance = createPortfolioI18n();
    expect(instance.isInitialized).toBe(true);
    expect(instance.resolvedLanguage).toBe(expected);
    expect(instance.t('boot')).toBe(resources[expected].common.boot);
  },
);

test('denied storage getter or read still initializes from browser language', () => {
  vi.stubGlobal('navigator', { language: 'ru-RU' });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied');
  });
  expect(createPortfolioI18n().resolvedLanguage).toBe('ru');
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new Error('denied');
  });
  expect(createPortfolioI18n().t('boot')).toBe('ЗАГРУЗКА...');
});

test('denied writes leave locale switching usable', async () => {
  const instance = createPortfolioI18n('en');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  await instance.changeLanguage('ru');
  expect(() => persistLocale('ru')).not.toThrow();
  expect(instance.t('back')).toBe('Назад');
});

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string' ? [path] : leafKeys(child, path);
  });
}

test('seven domains have identical complete EN/RU keys and no third locale', () => {
  expect(Object.keys(resources)).toEqual(['en', 'ru']);
  expect(Object.keys(resources.en)).toEqual([
    'common',
    'about',
    'projects',
    'toolkit',
    'contact',
    'options',
    'worlds',
  ]);
  expect(leafKeys(resources.ru)).toEqual(leafKeys(resources.en));
  for (const locale of ['en', 'ru'] as const) {
    const instance = createPortfolioI18n(locale);
    for (const ns of Object.keys(
      resources[locale],
    ) as (keyof typeof resources.en)[]) {
      for (const key of leafKeys(resources[locale][ns])) {
        expect(instance.exists(key, { ns, fallbackLng: false })).toBe(true);
        expect(instance.t(key, { ns })).not.toBe('');
      }
    }
  }
});
