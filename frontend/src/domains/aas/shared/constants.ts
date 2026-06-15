// AAS Module Constants
// Categories + Counts (from aas-opcua categories.ts) + Menu definitions

import type { OpcuaCategory } from './types'

// ─── OPC-UA Categories ───
export const OPCUA_CATEGORIES: OpcuaCategory[] = [
  'Temperature',
  'Time',
  'Vision',
  'Pressure',
  'VisionNG',
]

// ─── Category Counts 유틸리티 ───
// API 데이터 기반으로 카테고리별 카운트 계산
export function computeCategoryCounts(items: { category?: string | null }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const cat of OPCUA_CATEGORIES) counts[cat] = 0
  for (const item of items) {
    if (item.category && item.category in counts) counts[item.category]++
  }
  return counts
}

// ─── AAS Menu Items ───
export interface AasMenuItem {
  key: string
  label: string
  description: string
  path: string
}

export const AAS_MENU_ITEMS: AasMenuItem[] = [
  {
    key: 'modeling',
    label: 'AAS 모델 관리',
    description: 'AASX 파일 업로드 및 메타데이터 확인',
    path: '/aas/modeling',
  },
  {
    key: 'instances',
    label: 'Asset Instance 관리',
    description: 'Asset Type 정의 및 물리 설비 인스턴스 등록',
    path: '/aas/instances',
  },
  {
    key: 'connection',
    label: '데이터 연결',
    description: '데이터소스 연결, 매핑 설정, OPC-UA 노드 생성',
    path: '/aas/connection',
  },
  {
    key: 'mapping',
    label: '매핑 관리',
    description: 'PLC 주소 ↔ OPC-UA 노드 매핑 설정',
    path: '/aas/mapping',
  },
  {
    key: 'linkage',
    label: 'AAS 연계',
    description: 'AAS SubmodelElement ↔ OPC-UA 노드 연결 관리',
    path: '/aas/linkage',
  },
  {
    key: 'gateway',
    label: 'OPC-UA 게이트웨이',
    description: 'OPC-UA 서버 상태, 세션, 노드 모니터링',
    path: '/aas/gateway',
  },
  {
    key: 'monitor',
    label: '수집 모니터링',
    description: '실시간 데이터 수집 채널 및 상태 모니터링',
    path: '/aas/monitor',
  },
  {
    key: 'collection',
    label: '데이터 수집 관리',
    description: '수집 소스, 항목, OPC-UA 노드 관리',
    path: '/aas/collection',
  },
]
