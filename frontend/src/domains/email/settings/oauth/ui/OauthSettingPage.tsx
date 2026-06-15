import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';

export default function OauthSettingPage() {
  const { t } = useTranslation();
  const perm = usePermission('EM0040');

  if (perm.loading) {
    return null;
  }

  return (
    <div>
      <PageTitle title={t('menu.EM0040', '메일계정인증')} menuCode="EM0040" />
      <div style={{ padding: 20, color: '#94a3b8' }}>
        {t('common.preparing', '준비 중입니다.')}
      </div>
    </div>
  );
}
