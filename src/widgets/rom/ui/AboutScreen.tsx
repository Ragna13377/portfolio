import { type Ref, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { heroFrames } from '../../../shared/assets/scene';
import { useMediaQuery } from '../../../shared/lib/media-query';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './AboutScreen.module.scss';

export type AboutDialogueHandle = { revealAll: () => void };
const beats = [
  'tools',
  'interfaces',
  'states',
  'projects',
  'hobbies',
  'bicycle',
] as const;

export default function AboutScreen({
  ref,
  enabled,
  onBack,
}: {
  ref?: Ref<AboutDialogueHandle>;
  enabled: boolean;
  onBack: () => void;
}) {
  const { t } = useTranslation('about');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [revealed, setRevealed] = useState(() =>
    reducedMotion ? beats.length : 0,
  );
  const complete = reducedMotion || revealed === beats.length;
  const revealAll = () => {
    if (enabled) setRevealed(beats.length);
  };
  useImperativeHandle(ref, () => ({ revealAll }));

  useEffect(() => {
    if (!enabled || complete) return;
    const timer = window.setTimeout(
      () => setRevealed((count) => Math.min(beats.length, count + 1)),
      revealed === 0 ? 350 : 1100,
    );
    return () => window.clearTimeout(timer);
  }, [enabled, complete, revealed]);

  return (
    <>
      <h2 tabIndex={-1}>{t('common:menu.about')}</h2>
      <div className={styles.scene} data-about-scene>
        <div className={styles.profile}>
          <span>{t('role')}</span>
          <small>{t('education')}</small>
          <small>{t('english')}</small>
        </div>
        <div
          className={styles.hero}
          data-speaking={!complete}
          aria-hidden="true"
        >
          {heroFrames.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              draggable={false}
              style={{ '--pose': index } as import('react').CSSProperties}
            />
          ))}
        </div>
        <section
          className={styles.dialogue}
          data-reduced-motion={reducedMotion}
          aria-label={t('dialogueLabel')}
        >
          <svg className={styles.tail} viewBox="0 0 56 66" aria-hidden="true">
            <path d="M54 3 Q37 39 5 60 Q27 57 39 47 Q46 52 54 56" />
          </svg>
          <div className={styles.dialogueBody}>
            <ol>
              {beats.map((beat, index) => (
                <li
                  key={beat}
                  data-about-beat={beat}
                  data-visible={reducedMotion || index < revealed}
                >
                  {t(`dialogue.${beat}`)}
                </li>
              ))}
            </ol>
            <span className={styles.end} aria-hidden="true">
              {complete ? '▼' : '···'}
            </span>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>
        <RomBackButton onBack={onBack} className={styles.back} />
      </footer>
    </>
  );
}
