import {
  type CSSProperties,
  Fragment,
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import idle1 from '../../../assets/toolkit_sprites/idle_1.webp';
import idle2 from '../../../assets/toolkit_sprites/idle_2.webp';
import idle3 from '../../../assets/toolkit_sprites/idle_3.webp';
import run1 from '../../../assets/toolkit_sprites/run_1.webp';
import run2 from '../../../assets/toolkit_sprites/run_2.webp';
import run3 from '../../../assets/toolkit_sprites/run_3.webp';
import run4 from '../../../assets/toolkit_sprites/run_4.webp';
import {
  TOOLKIT_COLLECTIBLES,
  TOOLKIT_GROUPS,
  type ToolkitCollectible,
} from '../../../entities/toolkit';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import { HERO_HEIGHT, HERO_WIDTH, TILE_HEIGHT } from '../model/toolkitPhysics';
import {
  type ToolkitMovement,
  useToolkitScene,
} from '../model/useToolkitScene';
import styles from './ToolkitScreen.module.scss';

const idleFrames = [idle1, idle2, idle3];
const runFrames = [run1, run2, run3, run4];
const trailLengths = [0.18, 0.4, 0.58, 0.83, 1, 0.78, 0.64, 0.36, 0.2];

function TechIcon({ item }: { item: ToolkitCollectible }) {
  return item.icon ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={item.icon.path} />
    </svg>
  ) : (
    <span className={styles.mark} aria-hidden="true">
      {item.mark}
    </span>
  );
}

export default function ToolkitScreen({
  ref,
  enabled,
  collected,
  onCollect,
  onBack,
}: {
  ref?: Ref<ToolkitMovement>;
  enabled: boolean;
  collected: ReadonlySet<string>;
  onCollect: (id: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation('toolkit');
  const { hero, tiles, controls } = useToolkitScene(
    enabled,
    collected,
    onCollect,
    idleFrames,
    runFrames,
  );
  const lastId = [...collected].at(-1);
  const [milestone, setMilestone] = useState<number | null>(null);
  const collectedStep = Math.floor(collected.size / 5);
  const milestoneStep = useRef(collectedStep);
  useEffect(() => {
    const step = collectedStep;
    if (step <= milestoneStep.current) return;
    milestoneStep.current = step;
    setMilestone(step * 5);
    const timeout = window.setTimeout(() => setMilestone(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [collectedStep]);
  useImperativeHandle(ref, () => controls.current, [controls]);

  return (
    <>
      <header className={styles.header}>
        <h2 tabIndex={-1}>
          <span data-heading-text>{t('common:menu.toolkit')}</span>
        </h2>
      </header>
      <div className={styles.scene}>
        <div
          className={styles.playfield}
          role="img"
          aria-label={t('scene')}
          style={
            {
              '--hero-width': `${HERO_WIDTH}%`,
              '--hero-height': `${HERO_HEIGHT}%`,
              '--tile-height': `${TILE_HEIGHT}%`,
              '--tile-size': `${TILE_HEIGHT}cqh`,
            } as CSSProperties
          }
        >
          {TOOLKIT_COLLECTIBLES.map((item, index) => (
            <div
              key={item.id}
              ref={(node) => {
                tiles.current[index] = node;
              }}
              hidden
              data-pickup={item.id}
              className={styles.pickup}
              style={
                {
                  '--brand': item.color,
                  '--glyph': item.glyphColor,
                } as CSSProperties
              }
            >
              <span className={styles.trail} aria-hidden="true">
                {trailLengths.map((length, index) => (
                  <i
                    key={length}
                    style={
                      {
                        '--strand-height': `${length * 100}%`,
                        '--strand-x': `${index * 12.5}%`,
                        '--strand-delay': `${index * -0.13}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              </span>
              <TechIcon item={item} />
            </div>
          ))}
          <img
            ref={hero}
            className={styles.hero}
            src={idle1}
            alt=""
            draggable={false}
            data-toolkit-hero
          />
          {milestone !== null && (
            <span
              className={
                milestone === TOOLKIT_COLLECTIBLES.length
                  ? styles.complete
                  : styles.milestone
              }
              role="status"
              data-toolkit-notice
            >
              {milestone === TOOLKIT_COLLECTIBLES.length
                ? t('complete')
                : t('milestone', { count: milestone })}
            </span>
          )}
        </div>
        <aside className={styles.stack} aria-label={t('technologies')}>
          <div className={styles.stackHeader}>
            {t('collected', {
              count: collected.size,
              total: TOOLKIT_COLLECTIBLES.length,
            })}
          </div>
          <ul
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the full stack.
            tabIndex={0}
            data-toolkit-stack
            aria-label={t('technologies')}
          >
            {TOOLKIT_GROUPS.map((group) => (
              <Fragment key={group.id}>
                <li className={styles.groupLabel}>{t(group.id)}</li>
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    data-tech-id={item.id}
                    data-collected={collected.has(item.id)}
                    data-latest={item.id === lastId}
                    style={
                      {
                        '--brand': item.color,
                        '--glyph': item.glyphColor,
                      } as CSSProperties
                    }
                  >
                    <span className={styles.listIcon}>
                      <TechIcon item={item} />
                    </span>
                    <span>{item.name}</span>
                    <span
                      role="img"
                      className={styles.check}
                      aria-label={
                        collected.has(item.id) ? t('pickedUp') : t('pending')
                      }
                    >
                      {collected.has(item.id) ? '✓' : '·'}
                    </span>
                  </li>
                ))}
              </Fragment>
            ))}
          </ul>
        </aside>
      </div>
      <footer className={styles.footer}>
        <RomBackButton onBack={onBack} variant="game" />
        <span className={styles.hints}>
          <span className={styles.movementKeys} aria-hidden="true">
            {['left', 'right'].map((direction) => (
              <span className={styles.movementKey} key={direction}>
                <svg
                  viewBox="0 0 14 16"
                  aria-hidden="true"
                  className={
                    direction === 'right' ? styles.rightArrow : undefined
                  }
                >
                  <path d="M8 2H6v2H4v2H2v4h2v2h2v2h2v-4h4V6H8V2z" />
                </svg>
              </span>
            ))}
          </span>
          {t('moveHint')}
        </span>
      </footer>
    </>
  );
}
