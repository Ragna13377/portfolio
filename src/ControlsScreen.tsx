import { useTranslation } from 'react-i18next';
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
