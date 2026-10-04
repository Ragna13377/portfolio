import { useTranslation } from 'react-i18next';
import type { CartridgeId } from '../../../entities/cartridge';
import { PROJECTS } from '../../../entities/project';
import styles from './Rom.module.scss';

type Props = {
  project: (typeof PROJECTS)[number];
  onBack: () => void;
  cartridgeId?: CartridgeId;
};

export default function ProjectDetailScreen({
  project,
  onBack,
  cartridgeId = 'starfall',
}: Props) {
  const { t } = useTranslation('projects');
  return (
    <>
      <h2
        tabIndex={-1}
        data-location={t(
          `worlds:${cartridgeId}.stages.${PROJECTS.findIndex((item) => item.id === project.id)}`,
        )}
      >
        {t(`${project.id}.label`)}
      </h2>
      <p>{t(`${project.id}.type`)}</p>
      <ul className={styles.highlights}>
        {[0, 1, 2, 3].map((highlight) => (
          <li key={highlight}>{t(`${project.id}.highlights.${highlight}`)}</li>
        ))}
      </ul>
      <p>
        <strong>{t('tech')}</strong>
        <br />
        {project.tech}
      </p>
      <button type="button" data-rom-back onClick={() => onBack()}>
        {t('common:back')}
      </button>
    </>
  );
}
