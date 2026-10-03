import { useTranslation } from 'react-i18next';
import styles from './Rom.module.scss';
import { TOOLKIT_CATEGORIES } from './toolkit';

type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onBack: () => void;
};

export default function ToolkitScreen({
  selectedIndex,
  onSelect,
  onBack,
}: Props) {
  const { t } = useTranslation('toolkit');
  const category = TOOLKIT_CATEGORIES[selectedIndex];

  return (
    <>
      <h2>{t('common:menu.toolkit')}</h2>
      <div className={styles.inventory}>
        <nav aria-label={t('categories')}>
          <ul className={styles.menu}>
            {TOOLKIT_CATEGORIES.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={selectedIndex === index ? 'true' : undefined}
                  onFocus={() => onSelect(index)}
                  onClick={() => onSelect(index)}
                >
                  <span className={styles.cursor} aria-hidden="true">
                    {selectedIndex === index ? '▶' : '\u00a0'}
                  </span>
                  {t(item.id)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <ul
          className={styles.technologies}
          aria-label={t('technologies')}
          aria-live="polite"
        >
          {category.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <button
        className={styles.back}
        type="button"
        data-rom-back
        onClick={onBack}
      >
        {t('common:back')}
      </button>
    </>
  );
}
