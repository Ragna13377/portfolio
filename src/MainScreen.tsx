import { useTranslation } from 'react-i18next';
import { type CartridgeId, cartridge } from './cartridges';
import { MENU } from './menu';
import styles from './Rom.module.scss';

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
        <span className={styles.mascot}>
          <i />
          <b />
        </span>
      </div>
    </>
  );
}
