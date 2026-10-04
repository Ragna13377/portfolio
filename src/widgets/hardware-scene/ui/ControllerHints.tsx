import { useTranslation } from 'react-i18next';
import styles from './ControllerHints.module.scss';

export default function ControllerHints() {
  const { t } = useTranslation('common');
  return (
    <aside
      className={styles.hints}
      data-controller-hints
      aria-label={t('hints.title')}
    >
      <p className={styles.title}>{t('hints.title')}</p>
      <dl>
        <div>
          <dt>↑ ↓</dt>
          <dd>{t('hints.navigate')}</dd>
        </div>
        <div>
          <dt>
            A <span>(Enter)</span>
          </dt>
          <dd>{t('hints.select')}</dd>
        </div>
        <div>
          <dt>
            B <span>(Esc)</span>
          </dt>
          <dd>{t('hints.back')}</dd>
        </div>
        <div>
          <dt>Start</dt>
          <dd>{t('hints.settings')}</dd>
        </div>
      </dl>
      <svg
        className={styles.arrow}
        viewBox="0 0 140 130"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 8C75 6 72 75 125 112M101 108L125 112L117 89"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </aside>
  );
}
