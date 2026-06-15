import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';

export default function CustomerMappingPage() {
  const { t } = useTranslation();
  const perm = usePermission('EM0030');

  if (perm.loading) {
    return null;
  }

  return (
    <div>
      <PageTitle title={t('menu.EM0030', '고객사이메일매핑')} menuCode="EM0030" />
      <div style={{ padding: 20, color: '#94a3b8' }}>
        {t('common.preparing', '준비 중입니다.')}
      </div>
    </div>
  );
}
