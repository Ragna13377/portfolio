import { useTranslation } from 'react-i18next';
import { LOCALES, type Locale } from '../../../shared/config/i18n';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
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
                <span className={styles.activeLocale}>
                  {i18n.resolvedLanguage === locale ? (
                    <>
                      ✓{' '}
                      <span className={styles.activeLabel}>{t('active')}</span>
                    </>
                  ) : (
                    '\u00a0'
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <RomBackButton onBack={onBack} className={styles.back} />
    </>
  );
}
