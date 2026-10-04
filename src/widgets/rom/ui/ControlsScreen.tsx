import { useTranslation } from 'react-i18next';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './Rom.module.scss';

export default function ControlsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('options');
  return (
    <>
      <h2 tabIndex={-1}>{t('controls')}</h2>
      <dl className={styles.controlList}>
        {['navigation', 'confirm', 'back', 'options', 'mouse'].map(
          (control) => (
            <div key={control}>
              <dt>{t(control)}</dt>
              <dd>{t(`${control}Keys`)}</dd>
            </div>
          ),
        )}
      </dl>
      <RomBackButton onBack={onBack} className={styles.back} />
    </>
  );
}
