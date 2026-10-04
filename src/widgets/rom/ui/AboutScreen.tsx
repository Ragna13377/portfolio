import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import talkFirst from '../../../assets/about_sprites/talk_1.webp';
import talkSecond from '../../../assets/about_sprites/talk_2.webp';
import talkThird from '../../../assets/about_sprites/talk_3.webp';
import talkFourth from '../../../assets/about_sprites/talk_4.webp';
import { useMediaQuery } from '../../../shared/lib/media-query';
import styles from './AboutScreen.module.scss';

export type AboutDialogueHandle = {
  revealAll: () => void;
  scroll: (direction: 'up' | 'down') => boolean;
};
const talkFrames = [talkFirst, talkSecond, talkThird, talkFourth] as const;
const beats = [
  'intro',
  'interfaces',
  'experience',
  'craft',
  'projects',
  'education',
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
  const story = useRef<HTMLOListElement>(null);
  const [revealed, setRevealed] = useState(() =>
    reducedMotion ? beats.length : 0,
  );
  const complete = reducedMotion || revealed === beats.length;
  const revealAll = () => {
    if (enabled) setRevealed(beats.length);
  };
  useImperativeHandle(ref, () => ({
    revealAll,
    scroll: (direction) => {
      const element = story.current;
      if (!enabled || !element) return false;
      const bottom = Math.max(0, element.scrollHeight - element.clientHeight);
      if (direction === 'down' && element.scrollTop >= bottom - 1) return false;
      element.scrollTop = Math.max(
        0,
        Math.min(bottom, element.scrollTop + (direction === 'down' ? 64 : -64)),
      );
      return true;
    },
  }));

  useEffect(() => {
    if (!enabled || complete) return;
    const timer = window.setTimeout(
      () => setRevealed((count) => Math.min(beats.length, count + 1)),
      revealed === 0 ? 200 : 550,
    );
    return () => window.clearTimeout(timer);
  }, [enabled, complete, revealed]);

  return (
    <>
      <h2 tabIndex={-1}>{t('common:menu.about')}</h2>
      <div className={styles.scene} data-about-scene>
        <div className={styles.hero} aria-hidden="true">
          {talkFrames.map((src, index) => (
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
            <ol ref={story} data-about-scroll aria-label={t('dialogueLabel')}>
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
              ▼
            </span>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          data-rom-back
          className={styles.back}
          onClick={onBack}
        >
          <span className={styles.keycap} aria-hidden="true">
            B
          </span>
          {t('common:back')}
        </button>
      </footer>
    </>
  );
}
