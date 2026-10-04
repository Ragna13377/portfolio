import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import enAbout from './locales/en/about.json';
import enCommon from './locales/en/common.json';
import enContact from './locales/en/contact.json';
import enOptions from './locales/en/options.json';
import enProjects from './locales/en/projects.json';
import enToolkit from './locales/en/toolkit.json';
import enWorlds from './locales/en/worlds.json';
import ruAbout from './locales/ru/about.json';
import ruCommon from './locales/ru/common.json';
import ruContact from './locales/ru/contact.json';
import ruOptions from './locales/ru/options.json';
import ruProjects from './locales/ru/projects.json';
import ruToolkit from './locales/ru/toolkit.json';
import ruWorlds from './locales/ru/worlds.json';

export type Locale = 'en' | 'ru';
export const LOCALES: readonly Locale[] = ['en', 'ru'];
export const LOCALE_STORAGE_KEY = 'portfolio-locale';
export const resources = {
  en: {
    common: enCommon,
    about: enAbout,
    projects: enProjects,
    toolkit: enToolkit,
    contact: enContact,
    options: enOptions,
    worlds: enWorlds,
  },
  ru: {
    common: ruCommon,
    about: ruAbout,
    projects: ruProjects,
    toolkit: ruToolkit,
    contact: ruContact,
    options: ruOptions,
    worlds: ruWorlds,
  },
};

export function readInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // Storage can be denied; browser language still works on the first visit.
  }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function createPortfolioI18n(locale: Locale = readInitialLocale()) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: locale,
    supportedLngs: [...LOCALES],
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: Object.keys(resources.en),
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}

export function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // The current session can change language even when persistence is denied.
  }
}

export const i18n = createPortfolioI18n();
