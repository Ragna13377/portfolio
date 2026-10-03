import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT } from './contact';
import styles from './Rom.module.scss';

type Props = { onBack: () => void };

export default function ContactScreen({ onBack }: Props) {
  const { t } = useTranslation('contact');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const request = useRef(0);

  useEffect(
    () => () => {
      request.current++;
      window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy(value: string) {
    const current = ++request.current;
    window.clearTimeout(timer.current);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(value);
      if (current !== request.current) return;
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Unavailable or denied clipboard access leaves Contact usable.
    }
  }

  return (
    <>
      <h2 tabIndex={-1}>{t('common:menu.contact')}</h2>
      <ul className={styles.channels} aria-label={t('channels')}>
        <li>
          <h3>{t('telegram')}</h3>
          <p>{CONTACT.telegram.value}</p>
          <div className={styles.actions}>
            <a
              href={CONTACT.telegram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('openTelegram')}
            >
              {t('common:open')}
            </a>
            <button
              type="button"
              aria-label={t('copyTelegram')}
              onClick={() => copy(CONTACT.telegram.value)}
            >
              {t('common:copy')}
            </button>
          </div>
        </li>
        <li>
          <h3>{t('github')}</h3>
          <p>{CONTACT.github.value}</p>
          <div className={styles.actions}>
            <a
              href={CONTACT.github.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('openGithub')}
            >
              {t('common:open')}
            </a>
          </div>
        </li>
        <li>
          <h3>{t('email')}</h3>
          <p>{CONTACT.email.value}</p>
          <div className={styles.actions}>
            <button
              type="button"
              aria-label={t('copyEmail')}
              onClick={() => copy(CONTACT.email.value)}
            >
              {t('common:copy')}
            </button>
          </div>
        </li>
      </ul>
      <div className={styles.contactFooter}>
        <button type="button" data-rom-back onClick={onBack}>
          {t('common:back')}
        </button>
        <span role="status">{copied ? t('common:copied') : ''}</span>
      </div>
    </>
  );
}
