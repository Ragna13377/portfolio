import { useTranslation } from 'react-i18next';
import { LOCALES, type Locale } from '../../../shared/config/i18n';
import styles from './Rom.module.scss';

type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate: (locale: Locale) => void;
  onBack: () => void;
};

export default function LanguageScreen({
  selectedIndex,
  onSelect,
  onActivate,
  onBack,
}: Props) {
  const { t, i18n } = useTranslation('options');
  return (
    <>
      <h2>{t('language')}</h2>
      <nav aria-label={t('language')}>
        <ul className={styles.menu}>
          {LOCALES.map((locale, index) => (
            <li key={locale}>
              <button
                type="button"
                aria-current={selectedIndex === index ? 'true' : undefined}
                aria-pressed={i18n.resolvedLanguage === locale}
                onFocus={() => onSelect(index)}
                onClick={() => onActivate(locale)}
              >
                <span className={styles.cursor} aria-hidden="true">
                  {selectedIndex === index ? '▶' : '\u00a0'}
                </span>
                {t(locale)}
                {i18n.resolvedLanguage === locale && (
                  <span className={styles.activeLocale}>
                    {' '}
                    ✓ <span className={styles.activeLabel}>{t('active')}</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button
        className={styles.back}
        type="button"
        data-rom-back
        onClick={onBack}
      >
        {t('common:back')}
      </button>
    </>
  );
}
