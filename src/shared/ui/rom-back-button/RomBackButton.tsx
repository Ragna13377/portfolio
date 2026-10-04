import { useTranslation } from 'react-i18next';
import styles from './RomBackButton.module.scss';

export function RomBackButton({
  onBack,
  className = '',
  variant = 'default',
}: {
  onBack: () => void;
  className?: string;
  variant?: 'default' | 'game';
}) {
  const { t } = useTranslation('common');
  return (
    <button
      type="button"
      data-rom-back
      className={`${variant === 'game' ? styles.game : styles.button} ${className}`}
      onClick={onBack}
    >
      {variant === 'game' && (
        <span className={styles.keycap} aria-hidden="true">
          <svg viewBox="0 0 14 16" focusable="false" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M3 2h6v2h2v3H9v2h2v3H9v2H3V2zm2 2v3h4V4H5zm0 5v3h4V9H5z"
            />
          </svg>
        </span>
      )}
      {t('back')}
    </button>
  );
}
