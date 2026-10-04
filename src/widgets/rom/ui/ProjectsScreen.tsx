import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import islandOne from '../../../assets/project_1.webp';
import islandTwo from '../../../assets/project_2.webp';
import islandThree from '../../../assets/project_3.webp';
import islandFour from '../../../assets/project_4.webp';
import { PROJECTS } from '../../../entities/project';
import { technologyVisual } from '../../../entities/toolkit';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './ProjectsScreen.module.scss';

const islands = [islandOne, islandTwo, islandThree, islandFour];
const routeStars = [
  [139, 74],
  [195, 79],
  [303, 88],
  [362, 74],
  [473, 72],
  [529, 82],
];

type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onBack: () => void;
};

export default function ProjectsScreen({
  selectedIndex,
  onSelect,
  onBack,
}: Props) {
  const { t } = useTranslation('projects');
  const project = PROJECTS[selectedIndex];
  return (
    <>
      <header className={styles.header}>
        <h2 tabIndex={-1}>
          <span data-heading-text>{t('heading')}</span>
        </h2>
      </header>
      <nav className={styles.stages} aria-label={t('select')}>
        <svg className={styles.route} viewBox="0 0 670 150" aria-hidden="true">
          <path d="M84 90 C145 46 188 92 251 90 S355 51 419 68 S527 110 586 88" />
          {routeStars.map(([x, y]) => (
            <path
              key={x}
              className={styles.star}
              d={`M${x} ${y - 3}v6m-3-3h6`}
            />
          ))}
        </svg>
        <span
          className={styles.selector}
          data-project-selector
          aria-hidden="true"
          style={{ left: `${12.5 + selectedIndex * 25}%` }}
        >
          ▼
        </span>
        <ul>
          {PROJECTS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={styles.stage}
                data-project-id={item.id}
                aria-current={selectedIndex === index ? 'true' : undefined}
                aria-controls="project-information"
                onFocus={() => onSelect(index)}
                onClick={() => onSelect(index)}
              >
                <img src={islands[index]} alt="" draggable={false} />
                <span>{t(`${item.id}.label`)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <section
        className={styles.information}
        id="project-information"
        aria-labelledby="project-title"
        data-project-information={project.id}
      >
        <div key={project.id} className={styles.content}>
          <h3 id="project-title">{t(`${project.id}.label`)}</h3>
          <p>{t(`${project.id}.description`)}</p>
          <h4>{t('tech')}</h4>
          <ul className={styles.technologies}>
            {project.technologies.map((technology) => {
              const visual = technologyVisual(technology.slug, technology.mark);
              return (
                <li
                  key={technology.name}
                  style={
                    {
                      '--brand': visual.color,
                      '--glyph': visual.glyphColor,
                    } as CSSProperties
                  }
                >
                  <span className={styles.icon} aria-hidden="true">
                    {visual.icon ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d={visual.icon.path} />
                      </svg>
                    ) : (
                      <span className={styles.mark}>{visual.mark}</span>
                    )}
                  </span>
                  <span>{technology.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <footer className={styles.footer}>
        <RomBackButton onBack={onBack} variant="game" />
      </footer>
    </>
  );
}
