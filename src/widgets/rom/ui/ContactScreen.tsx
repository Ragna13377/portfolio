import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT } from '../../../entities/contact';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './Rom.module.scss';

type Props = { onBack: () => void };

export default function ContactScreen({ onBack }: Props) {
  const { t } = useTranslation('contact');
  const [copied, setCopied] = useState<'telegram' | 'email' | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const request = useRef(0);

  useEffect(
    () => () => {
      request.current++;
      window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy(channel: 'telegram' | 'email') {
    const current = ++request.current;
    window.clearTimeout(timer.current);
    setCopied(null);
    try {
      await navigator.clipboard.writeText(CONTACT[channel].value);
      if (current !== request.current) return;
      setCopied(channel);
      timer.current = window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // Unavailable or denied clipboard access leaves Contact usable.
    }
  }

  return (
    <>
      <h2 tabIndex={-1}>
        <span data-heading-text>{t('common:menu.contact')}</span>
      </h2>
      <ul className={styles.channels} aria-label={t('channels')}>
        <li>
          <h3>{t('telegram')}</h3>
          <button
            type="button"
            aria-label={t('copyTelegram')}
            data-copied={copied === 'telegram'}
            onClick={() => copy('telegram')}
          >
            <CopyIcon copied={copied === 'telegram'} />
            <span>
              {t(copied === 'telegram' ? 'common:copied' : 'common:copy')}
            </span>
          </button>
        </li>
        <li>
          <h3>{t('email')}</h3>
          <button
            type="button"
            aria-label={t('copyEmail')}
            data-copied={copied === 'email'}
            onClick={() => copy('email')}
          >
            <CopyIcon copied={copied === 'email'} />
            <span>
              {t(copied === 'email' ? 'common:copied' : 'common:copy')}
            </span>
          </button>
        </li>
      </ul>
      <div className={styles.contactFooter}>
        <RomBackButton onBack={onBack} />
        <span className={styles.activeLabel} role="status">
          {copied ? t('common:copied') : ''}
        </span>
      </div>
    </>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d={
          copied
            ? 'M12 3h2v2h-2v2h-2v2H8v2H6v2H4v-2H2V9H0V7h2v2h2v2h2V9h2V7h2V5h2Z'
            : 'M5 1h10v10h-3V8h1V3H7v1H5ZM1 5h10v10H1Zm2 2v6h6V7Z'
        }
      />
    </svg>
  );
}
