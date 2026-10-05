import { useTranslation } from 'react-i18next';
import { type CartridgeId, cartridge } from '../../../entities/cartridge';
import { floatingIsland, heroFrames } from '../../../shared/assets/scene';
import { MENU } from '../../../shared/config/navigation';
import styles from './Rom.module.scss';

const heroSequence = [
  ...heroFrames.map((src) => ({ id: src, src })),
  ...heroFrames
    .slice(1, -1)
    .reverse()
    .map((src) => ({ id: `${src}-return`, src })),
];

type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate: (index: number) => void;
  cartridgeId?: CartridgeId;
  playerOffset?: number;
};

export default function MainScreen({
  selectedIndex,
  onSelect,
  onActivate,
  cartridgeId = 'starfall',
  playerOffset = 0,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <>
      <div className={styles.starlight} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className={styles.island} aria-hidden="true">
        <img src={floatingIsland} alt="" draggable={false} />
      </div>
      <div className={styles.gameTitle} aria-hidden="true">
        <span>{cartridge(cartridgeId).short}</span>
        <strong>A STAR ADVENTURE</strong>
      </div>
      <h1>{t('mainName')}</h1>
      <nav aria-label={t('mainMenu')}>
        <ul className={styles.menu}>
          {MENU.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                aria-current={selectedIndex === index ? 'true' : undefined}
                aria-disabled={false}
                onFocus={() => onSelect(index)}
                onClick={() => onActivate(index)}
              >
                <span className={styles.cursor} aria-hidden="true">
                  {selectedIndex === index ? '▶' : '\u00a0'}
                </span>
                {t(`menu.${label}`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div
        className={styles.menuPlayer}
        data-menu-player
        aria-hidden="true"
        style={
          {
            '--position': selectedIndex,
            '--offset': playerOffset,
          } as import('react').CSSProperties
        }
      >
        {heroSequence.map(({ id, src }, index) => (
          <img
            key={id}
            src={src}
            className={styles.heroFrame}
            data-frame={index}
            style={{ '--pose': index } as import('react').CSSProperties}
            alt=""
            draggable={false}
          />
        ))}
      </div>
    </>
  );
}
