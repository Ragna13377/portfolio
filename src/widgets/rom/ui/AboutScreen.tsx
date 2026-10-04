import { useTranslation } from 'react-i18next';
import { RomBackButton } from '../../../shared/ui/rom-back-button';

type Props = { onBack: () => void };

export default function AboutScreen({ onBack }: Props) {
  const { t } = useTranslation('about');
  return (
    <>
      <h2 tabIndex={-1}>{t('common:menu.about')}</h2>
      <p>{t('common:name')}</p>
      <p>{t('role')}</p>
      <p>{t('education')}</p>
      <p>{t('work')}</p>
      <p>{t('interests')}</p>
      <RomBackButton onBack={onBack} />
    </>
  );
}
