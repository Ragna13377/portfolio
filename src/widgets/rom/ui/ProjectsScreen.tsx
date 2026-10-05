import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import islandOne from '../../../assets/project_1.webp';
import islandTwo from '../../../assets/project_2.webp';
import islandThree from '../../../assets/project_3.webp';
import islandFour from '../../../assets/project_4.webp';
import showFirst from '../../../assets/project_sprites/show_1.webp';
import showSecond from '../../../assets/project_sprites/show_2.webp';
import showThird from '../../../assets/project_sprites/show_3.webp';
import showFourth from '../../../assets/project_sprites/show_4.webp';
import { PROJECTS } from '../../../entities/project';
import { technologyVisual } from '../../../entities/toolkit';
import { RomBackButton } from '../../../shared/ui/rom-back-button';
import styles from './ProjectsScreen.module.scss';

const islands = [islandOne, islandTwo, islandThree, islandFour];
const heroFrames = [
  { id: 'rest', src: showFirst },
  { id: 'raise', src: showSecond },
  { id: 'point', src: showThird },
  { id: 'hold', src: showFourth },
  { id: 'return-point', src: showThird },
  { id: 'return-raise', src: showSecond },
];
const routePath =
  'M84 74 C118 74 136 56 167 60 S216 62 251 62 C286 62 302 58 335 63 S384 76 419 76 C452 76 470 90 502 86 S552 78 586 78';
const routeStars = [
  [167, 60],
  [335, 63],
  [502, 86],
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
          <defs>
            <filter
              id="project-island-outline"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feMorphology
                in="SourceAlpha"
                operator="dilate"
                radius="0.8"
                result="expanded"
              />
              <feComposite
                in="expanded"
                in2="SourceAlpha"
                operator="out"
                result="edge"
              />
              <feFlood
                floodColor="#ffe080"
                floodOpacity="0.9"
                result="yellow"
              />
              <feComposite
                in="yellow"
                in2="edge"
                operator="in"
                result="outline"
              />
              <feMerge>
                <feMergeNode in="outline" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className={styles.routeGlow} d={routePath} />
          <path className={styles.routeDust} d={routePath} />
          {routeStars.map(([x, y]) => (
            <path
              key={x}
              className={styles.star}
              d={`M${x} ${y - 6}l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Z`}
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
                <span className={styles.islandArt}>
                  <img src={islands[index]} alt="" draggable={false} />
                </span>
                <span className={styles.stageLabel}>
                  {t(`${item.id}.label`)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.hero} aria-hidden="true">
        {heroFrames.map(({ id, src }, index) => (
          <img
            key={id}
            src={src}
            alt=""
            draggable={false}
            style={{ '--pose': index } as CSSProperties}
          />
        ))}
      </div>
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
