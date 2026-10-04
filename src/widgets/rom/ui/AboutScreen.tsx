import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import talkFirst from '../../../assets/about_sprites/talk_1.webp';
import talkSecond from '../../../assets/about_sprites/talk_2.webp';
import talkThird from '../../../assets/about_sprites/talk_3.webp';
import talkFourth from '../../../assets/about_sprites/talk_4.webp';
import talkFifth from '../../../assets/about_sprites/talk_5.webp';
import talkSixth from '../../../assets/about_sprites/talk_6.webp';
import talkSeventh from '../../../assets/about_sprites/talk_7.webp';
import cloudsMid from '../../../assets/clouds-mid.webp';
import cloudsNear from '../../../assets/clouds-near.webp';
import { useMediaQuery } from '../../../shared/lib/media-query';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './AboutScreen.module.scss';

export type AboutDialogueHandle = {
  revealAll: () => void;
  scroll: (direction: 'up' | 'down') => boolean;
};
const talkFrames = [
  talkFirst,
  talkSecond,
  talkThird,
  talkFourth,
  talkFifth,
  talkSixth,
  talkSeventh,
] as const;
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
  const scrollTarget = useRef<number | null>(null);
  const scrollFrame = useRef(0);
  const [lineCounts, setLineCounts] = useState<number[]>(() =>
    beats.map(() => 1),
  );
  const totalLines = lineCounts.reduce((sum, count) => sum + count, 0);
  const [revealed, setRevealed] = useState(() =>
    reducedMotion ? Number.POSITIVE_INFINITY : 0,
  );
  const complete = reducedMotion || revealed >= totalLines;
  const revealAll = () => {
    if (enabled) setRevealed(Number.POSITIVE_INFINITY);
  };
  useLayoutEffect(() => {
    const element = story.current;
    if (!element) return;
    const measure = () => {
      const counts = Array.from(element.children, (paragraph) => {
        const lineHeight =
          Number.parseFloat(getComputedStyle(paragraph).lineHeight) || 19.5;
        const text = paragraph.querySelector<HTMLElement>('[data-about-text]');
        return Math.max(
          1,
          Math.round(
            (text?.clientHeight || paragraph.clientHeight) / lineHeight,
          ),
        );
      });
      setLineCounts((previous) =>
        counts.every((count, index) => count === previous[index])
          ? previous
          : counts,
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);
  useImperativeHandle(ref, () => ({
    revealAll,
    scroll: (direction) => {
      const element = story.current;
      if (!enabled || !element) return false;
      const bottom = Math.max(0, element.scrollHeight - element.clientHeight);
      // Wait for more lines instead of selecting Back while dialogue is appearing.
      if (direction === 'down' && element.scrollTop >= bottom - 1)
        return !complete;
      scrollTarget.current = Math.max(
        0,
        Math.min(
          bottom,
          (scrollTarget.current ?? element.scrollTop) +
            (direction === 'down' ? 48 : -48),
        ),
      );
      if (reducedMotion) {
        element.scrollTop = scrollTarget.current;
        scrollTarget.current = null;
      } else if (!scrollFrame.current) {
        let previous = performance.now();
        const tick = (now: number) => {
          const dt = Math.min(64, now - previous);
          previous = now;
          const target = Math.min(
            scrollTarget.current ?? element.scrollTop,
            Math.max(0, element.scrollHeight - element.clientHeight),
          );
          const distance = target - element.scrollTop;
          if (Math.abs(distance) < 1) {
            element.scrollTop = target;
            scrollTarget.current = null;
            scrollFrame.current = 0;
            return;
          }
          element.scrollTop += distance * (1 - Math.exp(-dt / 45));
          scrollFrame.current = requestAnimationFrame(tick);
        };
        scrollFrame.current = requestAnimationFrame(tick);
      }
      return true;
    },
  }));

  useEffect(() => {
    if (!enabled || complete) return;
    const timer = window.setTimeout(
      () => setRevealed((count) => Math.min(totalLines, count + 1)),
      revealed === 0 ? 150 : 320,
    );
    return () => window.clearTimeout(timer);
  }, [enabled, complete, revealed, totalLines]);

  return (
    <>
      <div className={styles.sky} aria-hidden="true" data-about-clouds>
        <div
          className={styles.cloudsNear}
          style={{ backgroundImage: `url(${cloudsNear})` }}
        />
        <div
          className={styles.cloudsMid}
          style={{ backgroundImage: `url(${cloudsMid})` }}
        />
      </div>
      <h2 className={styles.heading} tabIndex={-1}>
        <span data-heading-text>{t('common:menu.about')}</span>
      </h2>
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
              {beats.map((beat, index) => {
                const precedingLines = lineCounts
                  .slice(0, index)
                  .reduce((sum, count) => sum + count, 0);
                const visibleLines = reducedMotion
                  ? lineCounts[index]
                  : Math.max(
                      0,
                      Math.min(lineCounts[index], revealed - precedingLines),
                    );
                const instant =
                  reducedMotion || revealed === Number.POSITIVE_INFINITY;
                const settledLines = instant
                  ? visibleLines
                  : Math.max(0, visibleLines - 1);
                return (
                  <li
                    key={beat}
                    data-about-beat={beat}
                    data-visible={visibleLines > 0}
                    data-revealed-lines={visibleLines}
                    style={{ height: `${visibleLines * 1.3}em` }}
                  >
                    <span
                      className={styles.settledLines}
                      data-about-text
                      style={{
                        clipPath:
                          settledLines >= lineCounts[index]
                            ? undefined
                            : `inset(0 0 max(0px, calc(100% - ${settledLines * 1.3}em)) 0)`,
                      }}
                    >
                      {t(`dialogue.${beat}`)}
                    </span>
                    {!instant && visibleLines > 0 && (
                      <span
                        key={visibleLines}
                        className={styles.revealingLine}
                        data-about-line
                        aria-hidden="true"
                        style={{
                          clipPath: `inset(${(visibleLines - 1) * 1.3}em 0 max(0px, calc(100% - ${visibleLines * 1.3}em)) 0)`,
                        }}
                      >
                        {t(`dialogue.${beat}`)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <span className={styles.end} aria-hidden="true">
              ▼
            </span>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>
        <RomBackButton onBack={onBack} variant="game" />
      </footer>
    </>
  );
}
