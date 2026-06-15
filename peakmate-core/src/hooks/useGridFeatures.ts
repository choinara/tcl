import { useMemo } from 'react';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import type { GridFeatureToggles } from '@/components/grid/types';

/**
 * 그리드 기능 토글 설정을 반환하는 훅.
 * PeakDataGrid / PeakEditGrid 내부에서 호출하여 개별 페이지 수정 없이 기능을 적용한다.
 *
 * 주의: 전체 prefs 구독 시 컬럼 폭 변경마다 features 새 객체가 생성되어
 * orderedColumns 재계산 → columnDefs 변경 → AG Grid 컬럼 폭 원복 버그 발생.
 * grid-features 키만 선택적으로 구독하여 불필요한 재계산 방지.
 */
export function useGridFeatures(): GridFeatureToggles {
  const getGridFeatures = usePreferenceStore((s) => s.getGridFeatures);
  const loaded = usePreferenceStore((s) => s.loaded);
  const featuresJson = usePreferenceStore((s) => s.prefs['pm-grid-features']);
  return useMemo(() => getGridFeatures(), [getGridFeatures, loaded, featuresJson]);
}
