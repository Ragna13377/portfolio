import { useTranslation } from 'react-i18next';
import type { CartridgeId } from './cartridges';
import { PROJECTS } from './projects';
import styles from './Rom.module.scss';

type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate: (index: number) => void;
  onBack: () => void;
  cartridgeId?: CartridgeId;
};

export default function ProjectsScreen({
  selectedIndex,
  onSelect,
  onActivate,
  onBack,
  cartridgeId = 'starfall',
}: Props) {
  const { t } = useTranslation('projects');
  return (
    <>
      <h2>{t('heading')}</h2>
      <nav aria-label={t('select')}>
        <ul className={styles.menu}>
          {PROJECTS.map((item, index) => (
            <li key={item.id}>
              <button
                data-location={t(`worlds:${cartridgeId}.stages.${index}`)}
                type="button"
                aria-current={selectedIndex === index ? 'true' : undefined}
                onFocus={() => onSelect(index)}
                onClick={() => onActivate(index)}
              >
                <span className={styles.cursor} aria-hidden="true">
                  {selectedIndex === index ? '>' : '\u00a0'}
                </span>
                {t(`${item.id}.label`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button
        className={styles.back}
        type="button"
        data-rom-back
        onClick={() => onBack()}
      >
        {t('common:back')}
      </button>
    </>
  );
}
