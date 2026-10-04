import { useTranslation } from 'react-i18next';
import styles from './RomBackButton.module.scss';

export function RomBackButton({
  onBack,
  className = '',
}: {
  onBack: () => void;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <button
      type="button"
      data-rom-back
      className={`${styles.button} ${className}`}
      onClick={onBack}
    >
      {t('back')}
    </button>
  );
}
