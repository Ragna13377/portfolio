import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT } from '../../../entities/contact';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
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
          <button
            type="button"
            aria-label={t('copyTelegram')}
            onClick={() => copy(CONTACT.telegram.value)}
          >
            {t('common:copy')}
          </button>
        </li>
        <li>
          <h3>{t('email')}</h3>
          <button
            type="button"
            aria-label={t('copyEmail')}
            onClick={() => copy(CONTACT.email.value)}
          >
            {t('common:copy')}
          </button>
        </li>
      </ul>
      <div className={styles.contactFooter}>
        <RomBackButton onBack={onBack} />
        <span role="status">{copied ? t('common:copied') : ''}</span>
      </div>
    </>
  );
}
