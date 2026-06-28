import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';

export default function AiUsagePage() {
  const { t } = useTranslation();
  const perm = usePermission('EM0050');

  if (perm.loading) {
    return null;
  }

  return (
    <div>
      <PageTitle />
      <div style={{ padding: 20, color: '#94a3b8' }}>
        {t('common.preparing', '준비 중입니다.')}
      </div>
    </div>
  );
}
