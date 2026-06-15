import { useState, useEffect, useCallback } from 'react';
import { CircleAlert } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { MenuMemoModal } from './MenuMemoModal';

interface MenuMemoButtonProps {
  menuCode: string;
  menuName: string;
}

export function MenuMemoButton({ menuCode, menuName }: MenuMemoButtonProps) {
  const [hasMemos, setHasMemos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const checkMemoExists = useCallback(async () => {
    try {
      const res = await authFetch(`/api/menu-memos/exists?menuCode=${encodeURIComponent(menuCode)}`);
      if (res.ok) {
        const json = await res.json();
        setHasMemos(json.data?.exists === true);
      }
    } catch {
      // 메모 존재 확인 실패 -- 기본값(검정) 유지
    }
  }, [menuCode]);

  useEffect(() => {
    checkMemoExists();
  }, [checkMemoExists]);

  const handleMemoCountChange = useCallback((count: number) => {
    setHasMemos(count > 0);
  }, []);

  return (
    <>
      <CircleAlert
        size={20}
        color={hasMemos ? '#ef4444' : '#000'}
        style={{ cursor: 'pointer', flexShrink: 0 }}
        onClick={() => setModalOpen(true)}
      />
      <MenuMemoModal
        menuCode={menuCode}
        menuName={menuName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onMemoCountChange={handleMemoCountChange}
      />
    </>
  );
}
