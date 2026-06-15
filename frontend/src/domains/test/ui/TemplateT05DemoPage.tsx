/**
 * [TS0060] T05 세로통합 매트릭스 데모
 * 설비/호기 × 서브행(PM일정·가동시간·제품별) × 날짜 축 매트릭스
 * rowspan + 동적 날짜 ColGroupDef + 근무조 pinnedTopRowData
 */
import TemplateT05Page from '../../../templates/TemplateT05';

export default function TemplateT05DemoPage() {
  return <TemplateT05Page menuCode="TS0060" />;
}
