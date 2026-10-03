import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './App.module.scss';
import { CONTACT } from './contact';
import { type Locale, persistLocale } from './i18n';
import { PROJECTS } from './projects';
import { TOOLKIT_CATEGORIES } from './toolkit';

export default function ReadablePortfolio({
  onReturn,
  error = false,
}: {
  onReturn?: () => void;
  error?: boolean;
}) {
  const { t, i18n } = useTranslation('common');
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  }, [i18n.resolvedLanguage]);
  function language(locale: Locale) {
    void i18n.changeLanguage(locale);
    persistLocale(locale);
  }
  return (
    <main className={styles.fallback}>
      <h1 ref={title} tabIndex={-1}>
        {t('name')}
      </h1>
      <p>{t('about:role')}</p>
      <p>
        {t(error ? 'experienceError' : onReturn ? 'readableIntro' : 'fallback')}
      </p>
      <div className={styles.readableActions}>
        <button
          type="button"
          onClick={() => language('en')}
          aria-pressed={i18n.resolvedLanguage === 'en'}
          lang="en"
        >
          English
        </button>
        <button
          type="button"
          onClick={() => language('ru')}
          aria-pressed={i18n.resolvedLanguage === 'ru'}
          lang="ru"
        >
          Русский
        </button>
        {onReturn && (
          <button type="button" data-return-to-console onClick={onReturn}>
            {t('returnToConsole')}
          </button>
        )}
      </div>
      <p>{t('about:work')}</p>
      <details>
        <summary>{t('menu.projects')}</summary>
        {PROJECTS.map((project) => (
          <section key={project.id}>
            <h2>{t(`projects:${project.id}.label`)}</h2>
            <p>{t(`projects:${project.id}.type`)}</p>
            <ul>
              {[0, 1, 2, 3].map((item) => (
                <li key={item}>
                  {t(`projects:${project.id}.highlights.${item}`)}
                </li>
              ))}
            </ul>
            <p>{project.tech}</p>
          </section>
        ))}
      </details>
      <details>
        <summary>{t('menu.toolkit')}</summary>
        {TOOLKIT_CATEGORIES.map((category) => (
          <section key={category.id}>
            <h2>{t(`toolkit:${category.id}`)}</h2>
            <p>{category.items.join(' · ')}</p>
          </section>
        ))}
      </details>
      <nav aria-label={t('contactLinks')}>
        <a href={CONTACT.telegram.url}>Telegram: {CONTACT.telegram.value}</a>
        <a href={CONTACT.github.url}>GitHub: {CONTACT.github.value}</a>
        <a href={`mailto:${CONTACT.email.value}`}>{CONTACT.email.value}</a>
      </nav>
    </main>
  );
}
