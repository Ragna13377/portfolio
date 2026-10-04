import { useTranslation } from 'react-i18next';
import styles from './DesktopFallback.module.scss';
export default function DesktopFallback({
  error = false,
}: {
  error?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <main className={styles.fallback}>
      <div>
        <span aria-hidden="true">✦</span>
        <h1>{t('name')}</h1>
        <p>{t('about:role')}</p>
        <p>{t(error ? 'experienceError' : 'fallback')}</p>
      </div>
    </main>
  );
}
