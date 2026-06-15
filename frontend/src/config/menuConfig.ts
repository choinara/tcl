import type { MenuConfig, MenuGroup } from '@/components/layout/types';

const fb = (label: string) => ({ label, fallback: label });
const fbItem = (path: string, label: string) => ({ path, ...fb(label) });

const fallbackMenuStructure: MenuGroup[] = [
  { ...fb('대시보드'), icon: 'dashboard', path: '/' },
  {
    ...fb('조직관리'), icon: 'building',
    children: [
      fbItem('/organization/department', '부서관리'),
      fbItem('/organization/company', '회사관리'),
      fbItem('/organization/position', '직급관리'),
      fbItem('/system/users', '사용자관리'),
      fbItem('/organization/chart', '조직도'),
    ],
  },
  {
    ...fb('시스템관리'), icon: 'settings',
    children: [
      fbItem('/system/menus', '메뉴관리'),
      fbItem('/system/menu-auth', '메뉴권한관리'),
      fbItem('/system/roles', '역할관리'),
      fbItem('/system/settings', '시스템설정'),
      fbItem('/system/user-auth', '예외권한부여'),
      fbItem('/system/logs', '시스템로그'),
      fbItem('/system/notification', '알림/게시판'),
      fbItem('/system/ui-settings', 'UI설정'),
      fbItem('/system/common-codes', '공통코드관리'),
      fbItem('/system/i18n', '다국어관리'),
    ],
  },
  {
    ...fb('기준정보관리'), icon: 'database',
    children: [
      fbItem('/master/customer', '고객관리'),
      // fbItem('/master/supplier', '협력업체관리'), — 협력사관리로 통합
      fbItem('/master/standard-time', '표준시간관리'),
      fbItem('/master/process-chemical', '공정별약품'),
      fbItem('/master/equipment', '생산설비'),
      fbItem('/master/raw-material', '원자재'),
      fbItem('/master/product', '제품'),
      fbItem('/master/production-rate', '시간당생산량'),
      fbItem('/master/quality-standard', '품질기준정보'),
      fbItem('/master/quality-spec', '품종별Spec'),
      fbItem('/master/appearance-inspection', '외관검사항목'),
      fbItem('/master/partner', '협력사관리'),
    ],
  },
  {
    ...fb('전자결재'), icon: 'fileCheck',
    children: [
      fbItem('/approval', '결재함'),
      fbItem('/approval/new', '기안 작성'),
      fbItem('/utility/receipt-ocr', '영수증 OCR'),
      fbItem('/utility/reports', '리포트 관리'),
      fbItem('/utility/excel-convert', 'Excel 변환'),
      fbItem('/document/drawing', '도면관리'),
      fbItem('/document/sop', 'SOP관리'),
      fbItem('/document/certificate', '인증서관리'),
      fbItem('/document/technical', '기술문서'),
      fbItem('/document/template', '양식관리'),
      fbItem('/document/periodic', '정기문서관리'),
      fbItem('/approval/lines', '결재선관리'),
      fbItem('/approval/status', '결재현황'),
    ],
  },
  {
    ...fb('자재관리'), icon: 'package',
    children: [
      fbItem('/warehouse/pre-inbound', '가입고등록'),
    ],
  },
  {
    ...fb('생산관리'), icon: 'factory',
    children: [
      fbItem('/production/daily-plan', '일별생산계획등록'),
      fbItem('/production/order', '수주등록'),
      fbItem('/production/aps', 'APS 생산계획'),
      fbItem('/production/aps/capacity', '호기 가용능력'),
      fbItem('/production/aps/takt', 'Takt Time 마스터'),
      fbItem('/production/aps/gantt', 'APS 간트차트'),
      fbItem('/production/shipment-plan', '출하계획'),
    ],
  },
  {
    ...fb('설비기술'), icon: 'zap',
    children: [
      fbItem('/et/maintenance', '설비보전이력관리'),
      fbItem('/et/inspection', '정기검사관리'),
      fbItem('/et/repair-hist', '설비고장/수리이력'),
      fbItem('/et/spare', '설비 Spare 관리'),
      fbItem('/et/tech-info', '설비기술기준정보'),
      fbItem('/et/loss-mgmt', '설비별 Loss 관리'),
      fbItem('/et/mtbf', 'MTBF 관리'),
      fbItem('/et/mttr', 'MTTR 관리'),
      fbItem('/et/loss-event', '설비 Loss 전체 조회'),
      fbItem('/et/operation-plan', '설비가동계획'),
      fbItem('/et/dashboard', '설비 종합 대시보드'),
    ],
  },
  {
    ...fb('이메일관리'), icon: 'mail',
    children: [
      fbItem('/email/list', '이메일목록'),
      fbItem('/email/settings/labels', '라벨매핑'),
      fbItem('/email/settings/customer-mapping', '고객사이메일매핑'),
      fbItem('/email/settings/oauth', '메일계정인증'),
      fbItem('/email/settings/ai-usage', 'AI사용량'),
    ],
  },
  {
    ...fb('개발도구'), icon: 'wrench',
    children: [
      fbItem('/test/components',    '컴포넌트 쇼케이스'),
      fbItem('/test/template-l1a',  'L1-A 인라인 편집'),
      fbItem('/test/template-l1b',  'L1-B 팝업 편집'),
      fbItem('/test/template-l2',   'L2 분할 그리드'),
      fbItem('/test/template-t03',  'T03 월별 매트릭스'),
      fbItem('/test/template-t05',  'T05 세로통합 매트릭스'),
    ],
  },
  {
    ...fb('AAS/OPC-UA'), icon: 'layers',
    children: [
      fbItem('/aas/modeling', 'AAS 모델 관리'),
      fbItem('/aas/instances', 'Asset Instance 관리'),
      fbItem('/aas/instances-old', 'Asset Instance 관리_old'),
      fbItem('/aas/collection', '데이터 수집 설정'),
      fbItem('/aas/connection', '데이터 연결'),
      fbItem('/aas/collection-items', '수집항목 관리'),
      fbItem('/aas/linkage', 'AAS 연계'),
      fbItem('/opcua/gateway', 'OPC-UA 게이트웨이'),
      fbItem('/aas/monitor', '수집 모니터링'),
      fbItem('/aas/pipeline-monitor', '수집모니터링2'),
    ],
  },
];

const menuCodeToI18nKey: Record<string, string> = {
  ORGANIZATION: '조직관리',
  SYSTEM: '시스템관리',
  APPROVAL: '전자결재',
  MASTER_MGMT: '기준정보관리',
  MATERIAL_MGMT: '자재관리',
  PRODUCTION: '생산관리',
  ET_MGMT: '설비기술',
  EM: '이메일관리',
  AAS_OPCUA: 'AAS/OPC-UA',
};

export const menuConfig: MenuConfig = {
  fallbackMenuStructure,
  menuCodeToI18nKey,
};
