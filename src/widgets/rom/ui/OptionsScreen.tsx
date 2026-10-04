import { useTranslation } from 'react-i18next';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './Rom.module.scss';

export const OPTIONS = ['language', 'controls'] as const;
type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate: (index: number) => void;
  onBack: () => void;
};

export default function OptionsScreen({
  selectedIndex,
  onSelect,
  onActivate,
  onBack,
}: Props) {
  const { t } = useTranslation('options');
  return (
    <>
      <h2>{t('heading')}</h2>
      <nav aria-label={t('heading')}>
        <ul className={styles.menu}>
          {OPTIONS.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                aria-current={selectedIndex === index ? 'true' : undefined}
                onFocus={() => onSelect(index)}
                onClick={() => onActivate(index)}
              >
                <span className={styles.cursor} aria-hidden="true">
                  {selectedIndex === index ? '▶' : '\u00a0'}
                </span>
                {t(option)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <RomBackButton onBack={onBack} className={styles.back} />
    </>
  );
}
