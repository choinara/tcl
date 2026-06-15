// AAS/OPC-UA Mock 데이터 — Excel 기반 실데이터 (PLC 및 비젼 최신 정리본_260205.xlsx)
// 데이터 출처: 6층 PLC 설비 수집 정보, 4,6층 비전 데이터 정보

import type {
  OpcuaCategory,
  OpcuaDataPoint,
  AasShell,
  AasSubmodel,
  AasElement,
  AssetType,
  AssetInstance,
  DataSource,
  MappingItem,
  OpcuaNode,
  CollectionChannel,
  CollectionStatus,
  CollectedRow,
  GatewaySession,
  GatewayEquipNode,
  GatewayLog,
} from '../types'

// ─── Helper: 카테고리별 mock 값 생성 ───
function mockVal(cat: OpcuaCategory, name: string): { value: number; unit: string } {
  switch (cat) {
    case 'Temperature': return { value: +(100 + Math.random() * 100).toFixed(1), unit: '°C' }
    case 'Time': {
      if (name.includes('Cnt') || name.includes('OK') || name.includes('NG') || name.includes('Output'))
        return { value: Math.floor(Math.random() * 100000), unit: 'count' }
      if (name.includes('Msg') || name.includes('Err') || name.includes('Alarm') || name.includes('status') || name.includes('EQstatus'))
        return { value: Math.floor(Math.random() * 10), unit: '' }
      if (name.includes('Loc') || name.includes('Set'))
        return { value: +(Math.random() * 100).toFixed(1), unit: 'mm' }
      return { value: +(Math.random() * 100).toFixed(0), unit: 'sec' }
    }
    case 'Vision': return { value: +(Math.random() * 50).toFixed(2), unit: 'mm' }
    case 'Pressure': return { value: +(Math.random() * 500).toFixed(1), unit: 'kPa' }
    case 'VisionNG': return { value: Math.floor(Math.random() * 100), unit: 'count' }
  }
}

// ─── Excel 기반 실데이터 포인트 정의 ───
interface RawPoint {
  korean: string
  english: string
  category: OpcuaCategory
  plc_addr: string
  data_type: string
}

const RAW_POINTS: RawPoint[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // Temperature (46개) — 6층 PLC 설비 수집 정보
  // ═══════════════════════════════════════════════════════════════════════════
  { korean: '상부탭예열', english: 'UpTabHeat', category: 'Temperature', plc_addr: 'D7801', data_type: 'Word' },
  { korean: '하부탭예열', english: 'DownTabHeat', category: 'Temperature', plc_addr: 'D7802', data_type: 'Word' },
  { korean: '상부롤히터', english: 'UpRollHeat', category: 'Temperature', plc_addr: 'D7803', data_type: 'Word' },
  { korean: '하부롤히터', english: 'DownRollHeat', category: 'Temperature', plc_addr: 'D7804', data_type: 'Word' },
  { korean: '상부필름연결(상)', english: 'UpFilmJoinTop', category: 'Temperature', plc_addr: 'D7845', data_type: 'Word' },
  { korean: '상부필름연결(하)', english: 'UpFilmJoinBottom', category: 'Temperature', plc_addr: 'D7805', data_type: 'Word' },
  { korean: '하부필름연결(상)', english: 'DownFilmJoinTop', category: 'Temperature', plc_addr: 'D7846', data_type: 'Word' },
  { korean: '하부필름연결(하)', english: 'DownFilmJoinBottom', category: 'Temperature', plc_addr: 'D7806', data_type: 'Word' },
  { korean: '상부탭예열유지', english: 'UpTabHeatKeep', category: 'Temperature', plc_addr: 'D7807', data_type: 'Word' },
  { korean: '하부탭예열유지', english: 'DownTabHeatKeep', category: 'Temperature', plc_addr: 'D7808', data_type: 'Word' },
  { korean: 'F-상부1차메탈(Sid)', english: 'Fup1stMTsid', category: 'Temperature', plc_addr: 'D7809', data_type: 'Word' },
  { korean: 'F-상부1차메탈(Mid)', english: 'Fup1stMTmid', category: 'Temperature', plc_addr: 'D7810', data_type: 'Word' },
  { korean: 'F-하부1차메탈(Sid)', english: 'Fdown1stMTsid', category: 'Temperature', plc_addr: 'D7811', data_type: 'Word' },
  { korean: 'F-하부1차메탈(Mid)', english: 'Fdown1stMTmid', category: 'Temperature', plc_addr: 'D7812', data_type: 'Word' },
  { korean: 'F-상부1차푸셔', english: 'Fup1stMTpush', category: 'Temperature', plc_addr: 'D7813', data_type: 'Word' },
  { korean: 'F-하부1차푸셔', english: 'Fdown1stMTpush', category: 'Temperature', plc_addr: 'D7814', data_type: 'Word' },
  { korean: 'B-상부1차메탈(Sid)', english: 'Bup1stMTsid', category: 'Temperature', plc_addr: 'D7815', data_type: 'Word' },
  { korean: 'B-상부1차메탈(Mid)', english: 'Bup1stMTmid', category: 'Temperature', plc_addr: 'D7816', data_type: 'Word' },
  { korean: 'B-하부1차메탈(Sid)', english: 'Bdown1stMTsid', category: 'Temperature', plc_addr: 'D7817', data_type: 'Word' },
  { korean: 'B-하부1차메탈(Mid)', english: 'Bdown1stMTmid', category: 'Temperature', plc_addr: 'D7818', data_type: 'Word' },
  { korean: 'B-상부1차푸셔', english: 'Bup1stPush', category: 'Temperature', plc_addr: 'D7819', data_type: 'Word' },
  { korean: 'B-하부1차푸셔', english: 'Bdown1stPush', category: 'Temperature', plc_addr: 'D7820', data_type: 'Word' },
  { korean: 'F-상부필름융착', english: 'FupFilmFuse', category: 'Temperature', plc_addr: 'D7821', data_type: 'Word' },
  { korean: 'F-하부필름융착', english: 'FdownFilmFuse', category: 'Temperature', plc_addr: 'D7822', data_type: 'Word' },
  { korean: 'B-상부필름융착', english: 'BupFilmFuse', category: 'Temperature', plc_addr: 'D7823', data_type: 'Word' },
  { korean: 'B-하부필름융착', english: 'BdownFilmFuse', category: 'Temperature', plc_addr: 'D7824', data_type: 'Word' },
  { korean: 'F-상부2차메탈(Sid)', english: 'Fup2ndMTsid', category: 'Temperature', plc_addr: 'D7825', data_type: 'Word' },
  { korean: 'F-상부2차메탈(Mid)', english: 'Fup2ndMTmid', category: 'Temperature', plc_addr: 'D7826', data_type: 'Word' },
  { korean: 'F-하부2차메탈(Sid)', english: 'Fdown2ndMTsid', category: 'Temperature', plc_addr: 'D7827', data_type: 'Word' },
  { korean: 'F-하부2차메탈(Mid)', english: 'Fdown2ndMTmid', category: 'Temperature', plc_addr: 'D7828', data_type: 'Word' },
  { korean: 'B-상부2차메탈(Sid)', english: 'Bup2ndMTsid', category: 'Temperature', plc_addr: 'D7829', data_type: 'Word' },
  { korean: 'B-상부2차메탈(Mid)', english: 'Bup2ndMTmid', category: 'Temperature', plc_addr: 'D7830', data_type: 'Word' },
  { korean: 'B-하부2차메탈(Sid)', english: 'Bdown2ndMTsid', category: 'Temperature', plc_addr: 'D7831', data_type: 'Word' },
  { korean: 'B-하부2차메탈(Mid)', english: 'Bdown2ndMTmid', category: 'Temperature', plc_addr: 'D7832', data_type: 'Word' },
  { korean: 'F-상부3차메탈(Sid)', english: 'Fup3rdMTsid', category: 'Temperature', plc_addr: 'D7833', data_type: 'Word' },
  { korean: 'F-상부3차메탈(Mid)', english: 'Fup3rdMTmid', category: 'Temperature', plc_addr: 'D7834', data_type: 'Word' },
  { korean: 'F-하부3차메탈(Sid)', english: 'Fdown3rdMTsid', category: 'Temperature', plc_addr: 'D7835', data_type: 'Word' },
  { korean: 'F-하부3차메탈(Mid)', english: 'Fdown3rdMTmid', category: 'Temperature', plc_addr: 'D7836', data_type: 'Word' },
  { korean: 'B-상부3차메탈(Sid)', english: 'Bup3rdMTsid', category: 'Temperature', plc_addr: 'D7837', data_type: 'Word' },
  { korean: 'B-상부3차메탈(Mid)', english: 'Bup3rdMTmid', category: 'Temperature', plc_addr: 'D7838', data_type: 'Word' },
  { korean: 'B-하부3차메탈(Sid)', english: 'Bdown3rdMTsid', category: 'Temperature', plc_addr: 'D7839', data_type: 'Word' },
  { korean: 'B-하부3차메탈(Mid)', english: 'Bdown3rdMTmid', category: 'Temperature', plc_addr: 'D7840', data_type: 'Word' },
  { korean: 'F-상부필름성형냉각', english: 'FupFilmRfmCool', category: 'Temperature', plc_addr: 'D7841', data_type: 'Word' },
  { korean: 'F-하부필름성형냉각', english: 'FdownFilmRfmCool', category: 'Temperature', plc_addr: 'D7842', data_type: 'Word' },
  { korean: 'B-상부필름성형냉각', english: 'BupFilmRfmCool', category: 'Temperature', plc_addr: 'D7843', data_type: 'Word' },
  { korean: 'B-하부필름성형냉각', english: 'BdownFilmRfmCool', category: 'Temperature', plc_addr: 'D7844', data_type: 'Word' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Time (67개) — 6층 PLC 설비 수집 정보 (시간/상태/수량/위치 데이터)
  // ═══════════════════════════════════════════════════════════════════════════
  { korean: '1차메탈 대기시간', english: '1stMTwaittime', category: 'Time', plc_addr: 'D700', data_type: 'Word' },
  { korean: '1차메탈 가열시간', english: '1stMTheattime', category: 'Time', plc_addr: 'D701', data_type: 'Word' },
  { korean: '1차메탈 푸셔대기시간', english: '1stMTpushwaittime', category: 'Time', plc_addr: 'D702', data_type: 'Word' },
  { korean: '1차메탈 푸셔가열시간', english: '1stMTpushheattime', category: 'Time', plc_addr: 'D703', data_type: 'Word' },
  { korean: '2차메탈 대기시간', english: '2ndMTwaittime', category: 'Time', plc_addr: 'D704', data_type: 'Word' },
  { korean: '2차메탈 가열시간', english: '2ndMTheattime', category: 'Time', plc_addr: 'D705', data_type: 'Word' },
  { korean: '2차메탈 푸셔대기시간', english: '2ndMTpushwaittime', category: 'Time', plc_addr: 'D706', data_type: 'Word' },
  { korean: '2차메탈 푸셔가열시간', english: '2ndMTpushheattime', category: 'Time', plc_addr: 'D707', data_type: 'Word' },
  { korean: '3차메탈 대기시간', english: '3rdMTwaittime', category: 'Time', plc_addr: 'D708', data_type: 'Word' },
  { korean: '3차메탈 가열시간', english: '3rdMTheattime', category: 'Time', plc_addr: 'D709', data_type: 'Word' },
  { korean: '3차메탈 푸셔대기시간', english: '3rdMTpushwaittime', category: 'Time', plc_addr: 'D710', data_type: 'Word' },
  { korean: '3차메탈 푸셔가열시간', english: '3rdMTpushheattime', category: 'Time', plc_addr: 'D711', data_type: 'Word' },
  { korean: '필름융착서보히터1 대기', english: 'FilmFSH1operwaittime', category: 'Time', plc_addr: 'D712', data_type: 'Word' },
  { korean: '필름융착서보히터1 가열', english: 'FilmFSH1operheattime', category: 'Time', plc_addr: 'D713', data_type: 'Word' },
  { korean: '필름융착서보히터2 가열', english: 'FilmFSH2operheattime', category: 'Time', plc_addr: 'D714', data_type: 'Word' },
  { korean: '필름성형서보히터1 대기', english: 'FilmRSH1operwaittime', category: 'Time', plc_addr: 'D716', data_type: 'Word' },
  { korean: '필름성형서보히터1 가열', english: 'FilmRSH1operheattime', category: 'Time', plc_addr: 'D717', data_type: 'Word' },
  { korean: '필름성형서보히터2 가열', english: 'FilmRSH2operheattime', category: 'Time', plc_addr: 'D718', data_type: 'Word' },
  { korean: '필름성형부냉각온도설정', english: 'FilmRfmCoolTemp', category: 'Time', plc_addr: 'D722', data_type: 'Word' },
  { korean: '운전상태메시지', english: 'OperStatusMsg', category: 'Time', plc_addr: 'D927', data_type: 'Word' },
  { korean: '운전상황메시지', english: 'OperDtlMsg', category: 'Time', plc_addr: 'D3', data_type: 'Word' },
  { korean: '실린더동작이상', english: 'CylnderOperMsg', category: 'Time', plc_addr: 'D920', data_type: 'Word' },
  { korean: '온도이상', english: 'TempErrMsg', category: 'Time', plc_addr: 'D921', data_type: 'Word' },
  { korean: '연속불량', english: 'SqnFaultyAlarm', category: 'Time', plc_addr: 'D922', data_type: 'Word' },
  { korean: '비젼이상', english: 'VisionErr', category: 'Time', plc_addr: 'D923', data_type: 'Word' },
  { korean: 'PLC논리오류', english: 'PlcLogicErrMsg', category: 'Time', plc_addr: 'D924', data_type: 'Word' },
  { korean: '추가오류', english: 'AddErr', category: 'Time', plc_addr: 'D925', data_type: 'Word' },
  { korean: '서보이상', english: 'ServoErr', category: 'Time', plc_addr: 'D926', data_type: 'Word' },
  { korean: '컷팅수량', english: 'CuttingCnt', category: 'Time', plc_addr: 'D1572', data_type: 'DWord' },
  { korean: '취출부폐기수량', english: 'BdnScrapCnt', category: 'Time', plc_addr: 'D1574', data_type: 'DWord' },
  { korean: '예열부폐기수량', english: 'HeatScrapCnt', category: 'Time', plc_addr: 'D1576', data_type: 'DWord' },
  { korean: '성형부폐기수량', english: 'RfmScrapCnt', category: 'Time', plc_addr: 'D1578', data_type: 'DWord' },
  { korean: '생산수량', english: 'OutputCnt', category: 'Time', plc_addr: 'D1580', data_type: 'DWord' },
  { korean: '엣지불량수량', english: 'VsEdgeFaultyCnt', category: 'Time', plc_addr: 'D1582', data_type: 'DWord' },
  { korean: '상부불량수량', english: 'VsUpFaultyCnt', category: 'Time', plc_addr: 'D1584', data_type: 'DWord' },
  { korean: '상부치수불량수량', english: 'VsUpSizeFaultyCnt', category: 'Time', plc_addr: 'D1676', data_type: 'DWord' },
  { korean: '상부표면불량수량', english: 'VsUpFaceFaultyCnt', category: 'Time', plc_addr: 'D1678', data_type: 'DWord' },
  { korean: '하부불량수량', english: 'VsDownFaultyCnt', category: 'Time', plc_addr: 'D1586', data_type: 'DWord' },
  { korean: '하부치수불량수량', english: 'VsDownSizeFaultyCnt', category: 'Time', plc_addr: 'D1680', data_type: 'DWord' },
  { korean: '하부표면불량수량', english: 'VsDownFaceFaultyCnt', category: 'Time', plc_addr: 'D1682', data_type: 'DWord' },
  { korean: '설비상태', english: 'EQstatus', category: 'Time', plc_addr: 'D25', data_type: 'Word' },
  { korean: '양품', english: 'OK', category: 'Time', plc_addr: 'D900', data_type: 'DWord' },
  { korean: '불량', english: 'NG', category: 'Time', plc_addr: 'D210', data_type: 'DWord' },
  { korean: 'F-상부필름융착위치', english: 'FupFilmFuseLoc', category: 'Time', plc_addr: 'D506', data_type: 'Word' },
  { korean: 'F-하부필름융착위치', english: 'FdownFilmFuseLoc', category: 'Time', plc_addr: 'D518', data_type: 'Word' },
  { korean: 'B-상부필름융착위치', english: 'BupFilmFuseLoc', category: 'Time', plc_addr: 'D530', data_type: 'Word' },
  { korean: 'B-하부필름융착위치', english: 'BdownFilmFuseLoc', category: 'Time', plc_addr: 'D542', data_type: 'Word' },
  { korean: 'F-상부필름성형위치', english: 'FupFilmRfmLoc', category: 'Time', plc_addr: 'D554', data_type: 'Word' },
  { korean: 'F-하부필름성형위치', english: 'FdownFilmRfmLoc', category: 'Time', plc_addr: 'D566', data_type: 'Word' },
  { korean: 'B-상부필름성형위치', english: 'BupFilmRfmLoc', category: 'Time', plc_addr: 'D578', data_type: 'Word' },
  { korean: 'B-하부필름성형위치', english: 'BdownFilmRfmLoc', category: 'Time', plc_addr: 'D690', data_type: 'Word' },
  { korean: '메탈컷팅 설정수량', english: 'MtCutSet', category: 'Time', plc_addr: 'D1440', data_type: 'DWord' },
  { korean: '메탈컷팅 수량', english: 'MtCutCnt', category: 'Time', plc_addr: 'D1410', data_type: 'DWord' },
  { korean: '필름컷팅 설정수량', english: 'FmCutSet', category: 'Time', plc_addr: 'D1444', data_type: 'DWord' },
  { korean: '필름컷팅 수량', english: 'FmCutCnt', category: 'Time', plc_addr: 'D1414', data_type: 'DWord' },
  { korean: '#1트리밍Sid 설정수량', english: 'Tm1SidSet', category: 'Time', plc_addr: 'D1446', data_type: 'DWord' },
  { korean: '#1트리밍Sid 수량', english: 'Tm1SidCnt', category: 'Time', plc_addr: 'D1416', data_type: 'DWord' },
  { korean: '#1트리밍Mid 설정수량', english: 'Tm1MidSet', category: 'Time', plc_addr: 'D1448', data_type: 'DWord' },
  { korean: '#1트리밍Mid 수량', english: 'Tm1MidCnt', category: 'Time', plc_addr: 'D1418', data_type: 'DWord' },
  { korean: '#2트리밍Sid 설정수량', english: 'Tm2SidSet', category: 'Time', plc_addr: 'D1450', data_type: 'DWord' },
  { korean: '#2트리밍Sid 수량', english: 'Tm2SidCnt', category: 'Time', plc_addr: 'D1420', data_type: 'DWord' },
  { korean: '#2트리밍Mid 설정수량', english: 'Tm2MidSet', category: 'Time', plc_addr: 'D1452', data_type: 'DWord' },
  { korean: '#2트리밍Mid 수량', english: 'Tm2MidCnt', category: 'Time', plc_addr: 'D1422', data_type: 'DWord' },
  { korean: 'R컷팅Sid 설정수량', english: 'RCutSidSet', category: 'Time', plc_addr: 'D1442', data_type: 'DWord' },
  { korean: 'R컷팅Sid 수량', english: 'RCutSidCnt', category: 'Time', plc_addr: 'D1412', data_type: 'DWord' },
  { korean: 'R컷팅Mid 설정수량', english: 'RCutMidSet', category: 'Time', plc_addr: 'D1454', data_type: 'DWord' },
  { korean: 'R컷팅Mid 수량', english: 'RCutMidCnt', category: 'Time', plc_addr: 'D1424', data_type: 'DWord' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Vision (49개) — 4,6층 비전 데이터 정보 (치수 측정)
  // ═══════════════════════════════════════════════════════════════════════════
  { korean: '머리치수 좌', english: 'HeadLength_Left', category: 'Vision', plc_addr: 'ARR[0]', data_type: 'Float' },
  { korean: '머리치수 중', english: 'HeadLength_Middle', category: 'Vision', plc_addr: 'ARR[1]', data_type: 'Float' },
  { korean: '머리치수 우', english: 'HeadLength_Right', category: 'Vision', plc_addr: 'ARR[2]', data_type: 'Float' },
  { korean: '머리치수+필름폭 좌', english: 'HeadLength_FilmWidth_Left', category: 'Vision', plc_addr: 'ARR[3]', data_type: 'Float' },
  { korean: '머리치수+필름폭 좌(합)', english: 'HeadLength_FilmWidth_Left_Sum', category: 'Vision', plc_addr: 'ARR[4]', data_type: 'Float' },
  { korean: '필름폭 좌', english: 'FilmWidth_Left', category: 'Vision', plc_addr: 'ARR[5]', data_type: 'Float' },
  { korean: '메탈길이 좌', english: 'MetalLength_Left', category: 'Vision', plc_addr: 'ARR[6]', data_type: 'Float' },
  { korean: '메탈폭 상', english: 'MetalWidth_Up', category: 'Vision', plc_addr: 'ARR[7]', data_type: 'Float' },
  { korean: '필름총길이 상', english: 'FilmTotalLength_Up', category: 'Vision', plc_addr: 'ARR[8]', data_type: 'Float' },
  { korean: '날개치수 좌', english: 'WingLength_Left', category: 'Vision', plc_addr: 'ARR[9]', data_type: 'Float' },
  { korean: '비출길이 좌', english: 'BichoolLength_Left', category: 'Vision', plc_addr: 'ARR[10]', data_type: 'Float' },
  { korean: '직각도 좌하', english: 'Perpendicularity_LeftDown', category: 'Vision', plc_addr: 'ARR[11]', data_type: 'Float' },
  { korean: '직각도 좌상', english: 'Perpendicularity_LeftUp', category: 'Vision', plc_addr: 'ARR[12]', data_type: 'Float' },
  { korean: 'Length L1', english: 'LengthL1', category: 'Vision', plc_addr: 'ARR[13]', data_type: 'Float' },
  { korean: 'X1', english: 'X1', category: 'Vision', plc_addr: 'ARR[14]', data_type: 'Float' },
  { korean: '필름돌기 좌상 높이', english: 'FilmDolgi_LeftUp_Height', category: 'Vision', plc_addr: 'ARR[15]', data_type: 'Float' },
  { korean: '필름돌기 좌상 넓이', english: 'FilmDolgi_LeftUp_Width', category: 'Vision', plc_addr: 'ARR[16]', data_type: 'Float' },
  { korean: '필름돌기 좌하 높이', english: 'FilmDolgi_LeftDown_Height', category: 'Vision', plc_addr: 'ARR[17]', data_type: 'Float' },
  { korean: '필름돌기 좌하 넓이', english: 'FilmDolgi_LeftDown_Width', category: 'Vision', plc_addr: 'ARR[18]', data_type: 'Float' },
  { korean: '머리치수 편차', english: 'HeadLength_Deviation', category: 'Vision', plc_addr: 'ARR[19]', data_type: 'Float' },
  { korean: '비출길이 편차', english: 'BichoolLength_Deviation', category: 'Vision', plc_addr: 'ARR[20]', data_type: 'Float' },
  { korean: '필름폭 좌(내측)', english: 'FilmWidth_Left_Inside', category: 'Vision', plc_addr: 'ARR[21]', data_type: 'Float' },
  { korean: '필름폭 중(내측)', english: 'FilmWidth_Middle_Inside', category: 'Vision', plc_addr: 'ARR[22]', data_type: 'Float' },
  { korean: '필름폭 우(내측)', english: 'FilmWidth_Right_Inside', category: 'Vision', plc_addr: 'ARR[23]', data_type: 'Float' },
  { korean: '머리치수+필름폭 우', english: 'HeadLength_FilmWidth_Right', category: 'Vision', plc_addr: 'ARR[24]', data_type: 'Float' },
  { korean: '머리치수+필름폭 우(합)', english: 'HeadLength_FilmWidth_Right_Sum', category: 'Vision', plc_addr: 'ARR[25]', data_type: 'Float' },
  { korean: '필름폭 우', english: 'FilmWidth_Right', category: 'Vision', plc_addr: 'ARR[26]', data_type: 'Float' },
  { korean: '메탈길이 우', english: 'MetalLength_Right', category: 'Vision', plc_addr: 'ARR[27]', data_type: 'Float' },
  { korean: '메탈폭 하', english: 'MetalWidth_Down', category: 'Vision', plc_addr: 'ARR[28]', data_type: 'Float' },
  { korean: '필름총길이 하', english: 'FilmTotalLength_Down', category: 'Vision', plc_addr: 'ARR[29]', data_type: 'Float' },
  { korean: '날개치수 우', english: 'WingLength_Right', category: 'Vision', plc_addr: 'ARR[30]', data_type: 'Float' },
  { korean: '비출길이 우', english: 'BichoolLength_Right', category: 'Vision', plc_addr: 'ARR[31]', data_type: 'Float' },
  { korean: '직각도 우하', english: 'Perpendicularity_RightDown', category: 'Vision', plc_addr: 'ARR[32]', data_type: 'Float' },
  { korean: '직각도 우상', english: 'Perpendicularity_RightUp', category: 'Vision', plc_addr: 'ARR[33]', data_type: 'Float' },
  { korean: 'Length L2', english: 'LengthL2', category: 'Vision', plc_addr: 'ARR[34]', data_type: 'Float' },
  { korean: 'X2', english: 'X2', category: 'Vision', plc_addr: 'ARR[35]', data_type: 'Float' },
  { korean: '필름돌기 우상 높이', english: 'FilmDolgi_RightUp_Height', category: 'Vision', plc_addr: 'ARR[36]', data_type: 'Float' },
  { korean: '필름돌기 우상 넓이', english: 'FilmDolgi_RightUp_Width', category: 'Vision', plc_addr: 'ARR[37]', data_type: 'Float' },
  { korean: '필름돌기 우하 높이', english: 'FilmDolgi_RightDown_Height', category: 'Vision', plc_addr: 'ARR[38]', data_type: 'Float' },
  { korean: '필름돌기 우하 넓이', english: 'FilmDolgi_RightDown_Width', category: 'Vision', plc_addr: 'ARR[39]', data_type: 'Float' },
  { korean: '머리치수+필름폭 편차', english: 'HeadLength_FilmWidth_Deviation', category: 'Vision', plc_addr: 'ARR[40]', data_type: 'Float' },
  { korean: 'X1_X2', english: 'X1_X2', category: 'Vision', plc_addr: 'ARR[41]', data_type: 'Float' },
  { korean: '필름레진 좌상', english: 'FilmResinLeftUp', category: 'Vision', plc_addr: 'ARR[42]', data_type: 'Float' },
  { korean: '필름레진 중상', english: 'FilmResinMidUp', category: 'Vision', plc_addr: 'ARR[43]', data_type: 'Float' },
  { korean: '필름레진 우상', english: 'FilmResinRightUp', category: 'Vision', plc_addr: 'ARR[44]', data_type: 'Float' },
  { korean: '필름레진 좌하', english: 'FilmResinLeftDown', category: 'Vision', plc_addr: 'ARR[45]', data_type: 'Float' },
  { korean: '필름레진 중하', english: 'FilmResinMidDown', category: 'Vision', plc_addr: 'ARR[46]', data_type: 'Float' },
  { korean: '필름레진 우하', english: 'FilmResinRightDown', category: 'Vision', plc_addr: 'ARR[47]', data_type: 'Float' },
  { korean: '판정', english: 'Result', category: 'Vision', plc_addr: 'ARR[48]', data_type: 'Word' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Pressure (3개) — 압력 센서
  // ═══════════════════════════════════════════════════════════════════════════
  { korean: '압력센서 1ch', english: 'IF_Pressure_1ch', category: 'Pressure', plc_addr: 'D150', data_type: 'Word' },
  { korean: '압력센서 2ch', english: 'IF_Pressure_2ch', category: 'Pressure', plc_addr: 'D151', data_type: 'Word' },
  { korean: '압력센서 3ch', english: 'IF_Pressure_3ch', category: 'Pressure', plc_addr: 'D152', data_type: 'Word' },

  // ═══════════════════════════════════════════════════════════════════════════
  // VisionNG (102개) — 상부 51개 + 하부 51개
  // ═══════════════════════════════════════════════════════════════════════════
  // 상부 NG (51개)
  { korean: '상부 필름겹침', english: 'FlimOverlap_Up', category: 'VisionNG', plc_addr: 'ARR_NG[0]', data_type: 'Word' },
  { korean: '상부 찍힘/꺾임 A흑', english: 'AStabRollBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[1]', data_type: 'Word' },
  { korean: '상부 찍힘/꺾임 A백', english: 'AStabRollWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[2]', data_type: 'Word' },
  { korean: '상부 찍힘/꺾임 C흑', english: 'CStabRollBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[3]', data_type: 'Word' },
  { korean: '상부 찍힘/꺾임 C백', english: 'CStabRollWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[4]', data_type: 'Word' },
  { korean: '상부 오염/이물 A흑', english: 'APollUobjBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[5]', data_type: 'Word' },
  { korean: '상부 오염/이물 A백', english: 'APollUobjWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[6]', data_type: 'Word' },
  { korean: '상부 오염/이물 B흑', english: 'BPollUobjBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[7]', data_type: 'Word' },
  { korean: '상부 오염/이물 B백', english: 'BPollUobjWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[8]', data_type: 'Word' },
  { korean: '상부 오염/이물 C흑', english: 'CPollUobjBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[9]', data_type: 'Word' },
  { korean: '상부 오염/이물 C백', english: 'CPollUobjWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[10]', data_type: 'Word' },
  { korean: '상부 오염/이물 D흑', english: 'DPollUobjBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[11]', data_type: 'Word' },
  { korean: '상부 오염/이물 D백', english: 'DPollUobjWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[12]', data_type: 'Word' },
  { korean: '상부 오염/이물 E흑', english: 'EPollUobjBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[13]', data_type: 'Word' },
  { korean: '상부 오염/이물 E백', english: 'EPollUobjWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[14]', data_type: 'Word' },
  { korean: '상부 필름뜯김 상', english: 'FilmBitTop_Up', category: 'VisionNG', plc_addr: 'ARR_NG[15]', data_type: 'Word' },
  { korean: '상부 필름뜯김 하', english: 'FilmBitBottom_Up', category: 'VisionNG', plc_addr: 'ARR_NG[16]', data_type: 'Word' },
  { korean: '상부 필름농 좌', english: 'FilmNongLeft_Up', category: 'VisionNG', plc_addr: 'ARR_NG[17]', data_type: 'Word' },
  { korean: '상부 필름농 우', english: 'FilmNongRight_Up', category: 'VisionNG', plc_addr: 'ARR_NG[18]', data_type: 'Word' },
  { korean: '상부 S/C A흑', english: 'AscBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[19]', data_type: 'Word' },
  { korean: '상부 S/C A백', english: 'AscWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[20]', data_type: 'Word' },
  { korean: '상부 S/C C흑', english: 'CscBlack_Up', category: 'VisionNG', plc_addr: 'ARR_NG[21]', data_type: 'Word' },
  { korean: '상부 S/C C백', english: 'CscWhite_Up', category: 'VisionNG', plc_addr: 'ARR_NG[22]', data_type: 'Word' },
  { korean: '상부 엣지기포', english: 'EdgeBubble_Up', category: 'VisionNG', plc_addr: 'ARR_NG[23]', data_type: 'Word' },
  { korean: '상부 엣지경계', english: 'EdgeBubbleG_Up', category: 'VisionNG', plc_addr: 'ARR_NG[24]', data_type: 'Word' },
  { korean: '상부 엣지홀', english: 'EdgeHole_Up', category: 'VisionNG', plc_addr: 'ARR_NG[25]', data_type: 'Word' },
  { korean: '상부 필름누락1매', english: 'FilmOmit1_Up', category: 'VisionNG', plc_addr: 'ARR_NG[26]', data_type: 'Word' },
  { korean: '상부 필름겹침3매', english: 'FilmOverlap3_Up', category: 'VisionNG', plc_addr: 'ARR_NG[27]', data_type: 'Word' },
  { korean: '상부 필름Burr', english: 'FilmBurr_Up', category: 'VisionNG', plc_addr: 'ARR_NG[28]', data_type: 'Word' },
  { korean: '상부 핀홀치수1', english: 'Reserved30_Up', category: 'VisionNG', plc_addr: 'ARR_NG[29]', data_type: 'Word' },
  { korean: '상부 핀홀치수2', english: 'Reserved31_Up', category: 'VisionNG', plc_addr: 'ARR_NG[30]', data_type: 'Word' },
  { korean: '상부치수', english: 'Reserved32_Up', category: 'VisionNG', plc_addr: 'ARR_NG[31]', data_type: 'Word' },
  { korean: '상부 불량수량', english: 'Reserved33_Up', category: 'VisionNG', plc_addr: 'ARR_NG[32]', data_type: 'Word' },
  ...Array.from({ length: 17 }, (_, i) => ({
    korean: `상부 예비${34 + i}`,
    english: `Reserved${34 + i}_Up`,
    category: 'VisionNG' as OpcuaCategory,
    plc_addr: `ARR_NG[${33 + i}]`,
    data_type: 'Word',
  })),
  { korean: '상부 불량시간', english: 'Ctime_Up', category: 'VisionNG', plc_addr: 'ARR_NG[50]', data_type: 'Word' },

  // 하부 NG (51개)
  { korean: '하부 필름겹침', english: 'FlimOverlap_Down', category: 'VisionNG', plc_addr: 'ARR_NG[51]', data_type: 'Word' },
  { korean: '하부 찍힘/꺾임 A흑', english: 'AStabRollBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[52]', data_type: 'Word' },
  { korean: '하부 찍힘/꺾임 A백', english: 'AStabRollWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[53]', data_type: 'Word' },
  { korean: '하부 찍힘/꺾임 C흑', english: 'CStabRollBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[54]', data_type: 'Word' },
  { korean: '하부 찍힘/꺾임 C백', english: 'CStabRollWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[55]', data_type: 'Word' },
  { korean: '하부 오염/이물 A흑', english: 'APollUobjBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[56]', data_type: 'Word' },
  { korean: '하부 오염/이물 A백', english: 'APollUobjWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[57]', data_type: 'Word' },
  { korean: '하부 오염/이물 B흑', english: 'BPollUobjBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[58]', data_type: 'Word' },
  { korean: '하부 오염/이물 B백', english: 'BPollUobjWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[59]', data_type: 'Word' },
  { korean: '하부 오염/이물 C흑', english: 'CPollUobjBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[60]', data_type: 'Word' },
  { korean: '하부 오염/이물 C백', english: 'CPollUobjWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[61]', data_type: 'Word' },
  { korean: '하부 오염/이물 D흑', english: 'DPollUobjBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[62]', data_type: 'Word' },
  { korean: '하부 오염/이물 D백', english: 'DPollUobjWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[63]', data_type: 'Word' },
  { korean: '하부 오염/이물 E흑', english: 'EPollUobjBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[64]', data_type: 'Word' },
  { korean: '하부 오염/이물 E백', english: 'EPollUobjWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[65]', data_type: 'Word' },
  { korean: '하부 필름뜯김 상', english: 'FilmBitTop_Down', category: 'VisionNG', plc_addr: 'ARR_NG[66]', data_type: 'Word' },
  { korean: '하부 필름뜯김 하', english: 'FilmBitBottom_Down', category: 'VisionNG', plc_addr: 'ARR_NG[67]', data_type: 'Word' },
  { korean: '하부 필름농 좌', english: 'FilmNongLeft_Down', category: 'VisionNG', plc_addr: 'ARR_NG[68]', data_type: 'Word' },
  { korean: '하부 필름농 우', english: 'FilmNongRight_Down', category: 'VisionNG', plc_addr: 'ARR_NG[69]', data_type: 'Word' },
  { korean: '하부 S/C A흑', english: 'AscBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[70]', data_type: 'Word' },
  { korean: '하부 S/C A백', english: 'AscWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[71]', data_type: 'Word' },
  { korean: '하부 S/C C흑', english: 'CscBlack_Down', category: 'VisionNG', plc_addr: 'ARR_NG[72]', data_type: 'Word' },
  { korean: '하부 S/C C백', english: 'CscWhite_Down', category: 'VisionNG', plc_addr: 'ARR_NG[73]', data_type: 'Word' },
  { korean: '하부 엣지기포', english: 'EdgeBubble_Down', category: 'VisionNG', plc_addr: 'ARR_NG[74]', data_type: 'Word' },
  { korean: '하부 엣지경계', english: 'EdgeBubbleG_Down', category: 'VisionNG', plc_addr: 'ARR_NG[75]', data_type: 'Word' },
  { korean: '하부 엣지홀', english: 'EdgeHole_Down', category: 'VisionNG', plc_addr: 'ARR_NG[76]', data_type: 'Word' },
  { korean: '하부 필름누락2매', english: 'FilmOmit2_Down', category: 'VisionNG', plc_addr: 'ARR_NG[77]', data_type: 'Word' },
  { korean: '하부 필름겹침4매', english: 'FilmOverlap4_Down', category: 'VisionNG', plc_addr: 'ARR_NG[78]', data_type: 'Word' },
  { korean: '하부 필름Burr', english: 'FilmBurr_Down', category: 'VisionNG', plc_addr: 'ARR_NG[79]', data_type: 'Word' },
  { korean: '하부 핀홀치수1', english: 'Reserved30_Down', category: 'VisionNG', plc_addr: 'ARR_NG[80]', data_type: 'Word' },
  { korean: '하부 핀홀치수2', english: 'Reserved31_Down', category: 'VisionNG', plc_addr: 'ARR_NG[81]', data_type: 'Word' },
  { korean: '하부치수', english: 'Reserved32_Down', category: 'VisionNG', plc_addr: 'ARR_NG[82]', data_type: 'Word' },
  { korean: '하부 불량수량', english: 'Reserved33_Down', category: 'VisionNG', plc_addr: 'ARR_NG[83]', data_type: 'Word' },
  ...Array.from({ length: 17 }, (_, i) => ({
    korean: `하부 예비${34 + i}`,
    english: `Reserved${34 + i}_Down`,
    category: 'VisionNG' as OpcuaCategory,
    plc_addr: `ARR_NG[${84 + i}]`,
    data_type: 'Word',
  })),
  { korean: '하부 불량시간', english: 'Ctime_Down', category: 'VisionNG', plc_addr: 'ARR_NG[101]', data_type: 'Word' },
]

// ─── OPC-UA 데이터 포인트 생성 ───
export const MOCK_OPCUA_DATA_POINTS: OpcuaDataPoint[] = RAW_POINTS.map(p => {
  const mv = mockVal(p.category, p.english)
  return {
    node_id: `ns=2;s=EQUIP-6F-001/${p.category}/${p.english}`,
    browse_name: p.english,
    korean_name: p.korean,
    category: p.category,
    plc_address: p.plc_addr,
    data_type: p.data_type,
    sampling_ms: 1000,
    aas_path: `/OperationalData/${p.category}:${p.english}`,
    aas_linked: true,
    mock_value: mv.value,
    unit: mv.unit,
  }
})

export const OPCUA_CATEGORIES: OpcuaCategory[] = ['Temperature', 'Time', 'Vision', 'Pressure', 'VisionNG']

export function getPointsByCategory(cat: OpcuaCategory) {
  return MOCK_OPCUA_DATA_POINTS.filter(p => p.category === cat)
}

export const CATEGORY_COUNTS: Record<OpcuaCategory, number> = {
  Temperature: MOCK_OPCUA_DATA_POINTS.filter(p => p.category === 'Temperature').length,
  Time: MOCK_OPCUA_DATA_POINTS.filter(p => p.category === 'Time').length,
  Vision: MOCK_OPCUA_DATA_POINTS.filter(p => p.category === 'Vision').length,
  Pressure: MOCK_OPCUA_DATA_POINTS.filter(p => p.category === 'Pressure').length,
  VisionNG: MOCK_OPCUA_DATA_POINTS.filter(p => p.category === 'VisionNG').length,
}

// ─── Shell ---
export const MOCK_SHELLS: AasShell[] = [
  {
    aas_id: 'aas-001',
    id_short: 'ProductionEquipment',
    asset_kind: 'Instance',
    global_asset_id: 'urn:solbrain:equipment:production:001',
    description: '솔브레인 6층 생산설비 AAS Shell',
  },
]

// ─── Submodels ---
export const MOCK_SUBMODELS: AasSubmodel[] = [
  {
    submodel_id: 'sm-001',
    id_short: 'OperationalData',
    semantic_id: 'urn:solbrain:submodel:operational',
    shell_id: 'aas-001',
    element_count: MOCK_OPCUA_DATA_POINTS.length,
  },
  {
    submodel_id: 'sm-002',
    id_short: 'TechnicalData',
    semantic_id: 'urn:solbrain:submodel:technical',
    shell_id: 'aas-001',
    element_count: 8,
  },
]

// ─── Elements (AAS 연결된 것) ───
export const MOCK_ELEMENTS: AasElement[] = [
  ...MOCK_OPCUA_DATA_POINTS.map((p, i) => ({
    element_id: `el-${String(i + 1).padStart(3, '0')}`,
    submodel_id: 'sm-001',
    element_type: 'Property' as const,
    id_short: p.browse_name,
    element_path: `OperationalData/${p.category}/${p.browse_name}`,
    value_type: p.data_type === 'DWord' ? 'int' : p.data_type === 'Float' ? 'float' : 'int',
    value: String(p.mock_value),
    unit: p.unit,
  })),
  // TechnicalData
  { element_id: 'el-t01', submodel_id: 'sm-002', element_type: 'Property', id_short: 'RatedVoltage', element_path: 'TechnicalData/RatedVoltage', value_type: 'float', value: '220', unit: 'V' },
  { element_id: 'el-t02', submodel_id: 'sm-002', element_type: 'Property', id_short: 'RatedCurrent', element_path: 'TechnicalData/RatedCurrent', value_type: 'float', value: '15.5', unit: 'A' },
  { element_id: 'el-t03', submodel_id: 'sm-002', element_type: 'Property', id_short: 'RatedPower', element_path: 'TechnicalData/RatedPower', value_type: 'float', value: '3.4', unit: 'kW' },
  { element_id: 'el-t04', submodel_id: 'sm-002', element_type: 'Property', id_short: 'MaxSpeed', element_path: 'TechnicalData/MaxSpeed', value_type: 'float', value: '3000', unit: 'rpm' },
  { element_id: 'el-t05', submodel_id: 'sm-002', element_type: 'Property', id_short: 'Weight', element_path: 'TechnicalData/Weight', value_type: 'float', value: '450', unit: 'kg' },
  { element_id: 'el-t06', submodel_id: 'sm-002', element_type: 'Property', id_short: 'ManufactureDate', element_path: 'TechnicalData/ManufactureDate', value_type: 'string', value: '2024-03-15', unit: '' },
  { element_id: 'el-t07', submodel_id: 'sm-002', element_type: 'Property', id_short: 'FirmwareVersion', element_path: 'TechnicalData/FirmwareVersion', value_type: 'string', value: 'v2.1.4', unit: '' },
  { element_id: 'el-t08', submodel_id: 'sm-002', element_type: 'Property', id_short: 'SerialNumber', element_path: 'TechnicalData/SerialNumber', value_type: 'string', value: 'SB-EQ-2024-0315', unit: '' },
]

// ─── Asset Types ---
export const MOCK_ASSET_TYPES: AssetType[] = [
  { type_code: 'equipment', type_name: '생산설비', shell_id: 'aas-001' },
  { type_code: 'vision', type_name: '비전검사', shell_id: '' },
  { type_code: 'amr', type_name: 'AMR 이송로봇', shell_id: '' },
]

// ─── Asset Instances ---
export const MOCK_INSTANCES: AssetInstance[] = [
  { instance_id: 'EQUIP-6F-001', instance_name: 'CV-01A', type_code: 'equipment', location_floor: '6F', serial_number: 'CV-01A-001', status: 'ACTIVE', opcua_node_count: MOCK_OPCUA_DATA_POINTS.length },
  { instance_id: 'EQUIP-6F-002', instance_name: 'CV-01B', type_code: 'equipment', location_floor: '6F', serial_number: 'CV-01B-001', status: 'ACTIVE', opcua_node_count: MOCK_OPCUA_DATA_POINTS.length },
  { instance_id: 'EQUIP-6F-003', instance_name: 'CV-02A', type_code: 'equipment', location_floor: '6F', serial_number: 'CV-02A-001', status: 'ACTIVE', opcua_node_count: MOCK_OPCUA_DATA_POINTS.length },
  { instance_id: 'EQUIP-6F-004', instance_name: 'CV-02B', type_code: 'equipment', location_floor: '6F', serial_number: 'CV-02B-001', status: 'MAINTENANCE', opcua_node_count: MOCK_OPCUA_DATA_POINTS.length },
]

// ─── Data Sources (6층 비전 데이터 경로 기반) ---
export const MOCK_DATA_SOURCES: DataSource[] = [
  { source_id: 'ds-001', instance_id: 'EQUIP-6F-001', source_type: 'plc_modbus', host: '172.19.17.51', port: 502, extra: { unit_id: 1, timeout_ms: 3000 }, connected: true },
  { source_id: 'ds-002', instance_id: 'EQUIP-6F-002', source_type: 'plc_modbus', host: '172.19.17.52', port: 502, extra: { unit_id: 1, timeout_ms: 3000 }, connected: true },
  { source_id: 'ds-003', instance_id: 'EQUIP-6F-003', source_type: 'plc_modbus', host: '172.19.17.53', port: 502, extra: { unit_id: 1, timeout_ms: 3000 }, connected: true },
  { source_id: 'ds-004', instance_id: 'EQUIP-6F-004', source_type: 'plc_modbus', host: '172.19.17.54', port: 502, extra: { unit_id: 1, timeout_ms: 3000 }, connected: false },
  { source_id: 'ds-v01', instance_id: 'EQUIP-6F-001', source_type: 'vision_folder', host: '172.19.17.51', port: 445, extra: { share_path: '\\\\172.19.17.51\\CV_01A_VISION_SET' }, connected: true },
  { source_id: 'ds-v02', instance_id: 'EQUIP-6F-002', source_type: 'vision_folder', host: '172.19.17.52', port: 445, extra: { share_path: '\\\\172.19.17.52\\CV_01B_VISION_SET' }, connected: true },
]

// ─── Mappings (실제 PLC 주소 기반) ───
export const MOCK_MAPPINGS: MappingItem[] = MOCK_OPCUA_DATA_POINTS.map((p, i) => ({
  mapping_id: `m-${String(i + 1).padStart(3, '0')}`,
  element_path: `OperationalData/${p.category}/${p.browse_name}`,
  value_type: p.data_type === 'DWord' ? 'int' : p.data_type === 'Float' ? 'float' : 'int',
  unit: p.unit,
  source_id: 'ds-001',
  source_address: p.plc_address,
  channel: 'plc_1s' as const,
  scale_factor: p.category === 'Temperature' ? 0.1 : 1,
  offset_value: 0,
  polling_enabled: true,
  aas_linked: p.aas_linked,
  category: p.category,
}))

// ─── OPC-UA Node Tree (실데이터 기반 5개 카테고리) ───
function buildCategoryChildren(cat: OpcuaCategory, equipId: string): OpcuaNode[] {
  return MOCK_OPCUA_DATA_POINTS
    .filter(p => p.category === cat)
    .map(p => ({
      node_id: `ns=2;s=${equipId}/${cat}/${p.browse_name}`,
      browse_name: p.browse_name,
      node_class: 'Variable' as const,
      parent_id: `ns=2;s=${equipId}/${cat}`,
    }))
}

export const MOCK_OPCUA_TREE: OpcuaNode = {
  node_id: 'ns=2;s=Objects',
  browse_name: 'Objects',
  node_class: 'Object',
  parent_id: null,
  children: [
    {
      node_id: 'ns=2;s=DeviceSet',
      browse_name: 'DeviceSet',
      node_class: 'Object',
      parent_id: 'ns=2;s=Objects',
      children: [
        {
          node_id: 'ns=2;s=DeviceSet/Equipment',
          browse_name: 'Equipment',
          node_class: 'Object',
          parent_id: 'ns=2;s=DeviceSet',
          children: [
            {
              node_id: 'ns=2;s=DeviceSet/Equipment/EQUIP-6F-001',
              browse_name: 'EQUIP-6F-001 (CV-01A)',
              node_class: 'Object',
              parent_id: 'ns=2;s=DeviceSet/Equipment',
              children: OPCUA_CATEGORIES.map(cat => ({
                node_id: `ns=2;s=EQUIP-6F-001/${cat}`,
                browse_name: `${cat} (${CATEGORY_COUNTS[cat]})`,
                node_class: 'Object' as const,
                parent_id: 'ns=2;s=DeviceSet/Equipment/EQUIP-6F-001',
                children: buildCategoryChildren(cat, 'EQUIP-6F-001'),
              })),
            },
          ],
        },
      ],
    },
  ],
}

// ─── OPC-UA Server Config ---
export const MOCK_OPCUA_CONFIG = {
  endpoint: 'opc.tcp://192.168.1.200:4840',
  namespace_uri: 'urn:solbrain:opcua:server',
  security_policy: 'Basic256Sha256',
}

// ─── Collection Channels ---
export const MOCK_CHANNELS: CollectionChannel[] = [
  { channel_id: 'ch-001', name: 'plc_1s', active: false, collected_count: 0, last_collected: '-' },
]

// ─── Collection Status ---
export const MOCK_COLLECTION_STATUS: CollectionStatus[] = [
  { instance_id: 'EQUIP-6F-001', instance_name: 'CV-01A', connected: true, last_collected: '-', error_count: 0 },
  { instance_id: 'EQUIP-6F-002', instance_name: 'CV-01B', connected: true, last_collected: '-', error_count: 0 },
  { instance_id: 'EQUIP-6F-003', instance_name: 'CV-02A', connected: true, last_collected: '-', error_count: 0 },
  { instance_id: 'EQUIP-6F-004', instance_name: 'CV-02B', connected: false, last_collected: '-', error_count: 3 },
]

// ─── Mock Collected Data (실데이터 기반 샘플) ───
export const MOCK_COLLECTED_ROWS: CollectedRow[] = MOCK_OPCUA_DATA_POINTS.slice(0, 10).map((p, i) => ({
  timestamp: `2026-02-01 14:30:0${i}.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
  node_id: p.node_id,
  aas_path: p.aas_path,
  plc_address: p.plc_address,
  category: p.category,
  value: String(p.mock_value),
  unit: p.unit,
}))

// ─── AASX Parse Summary ---
export const MOCK_PARSE_SUMMARY = {
  file_name: 'ProductionEquipment_v2.1.aasx',
  fileHash: 'sha256:a1b2c3d4e5f6...',
  aasVersion: 'V3.0',
  shellCount: MOCK_SHELLS.length,
  submodelCount: MOCK_SUBMODELS.length,
  elementCount: MOCK_ELEMENTS.length,
}

// ─── OPC-UA Gateway ---
const TOTAL_NODE_COUNT = MOCK_OPCUA_DATA_POINTS.length

export const MOCK_GATEWAY_SERVER = {
  endpoint: 'opc.tcp://192.168.1.200:4840',
  namespace_uri: 'urn:solbrain:opcua:server',
  security_policy: 'Basic256Sha256',
  status: 'RUNNING' as const,
  uptime: '3d 14h 22m',
  total_sessions: 5,
  total_subscriptions: 12,
  total_monitored_items: TOTAL_NODE_COUNT,
  cpu_usage: 12.3,
  memory_mb: 256,
}

export const MOCK_GATEWAY_SESSIONS: GatewaySession[] = [
  { session_id: 'sess-001', client_name: 'ICC-Dashboard', client_ip: '192.168.1.10', connected_at: '2026-01-30 08:00', subscriptions: 4, monitored_items: 80 },
  { session_id: 'sess-002', client_name: 'MES-Collector', client_ip: '192.168.1.20', connected_at: '2026-01-30 08:01', subscriptions: 3, monitored_items: 60 },
  { session_id: 'sess-003', client_name: 'SCADA-Client', client_ip: '192.168.1.30', connected_at: '2026-01-31 09:15', subscriptions: 3, monitored_items: 60 },
  { session_id: 'sess-004', client_name: 'Historian-Agent', client_ip: '192.168.1.40', connected_at: '2026-02-01 06:00', subscriptions: 2, monitored_items: 67 },
]

export const MOCK_GATEWAY_EQUIP_NODES: GatewayEquipNode[] = [
  { instance_id: 'EQUIP-6F-001', instance_name: 'CV-01A', node_count: TOTAL_NODE_COUNT, connected: true, last_read: '14:30:01', last_write: '14:29:55', read_count: 152340, write_count: 1205, error_count: 0 },
  { instance_id: 'EQUIP-6F-002', instance_name: 'CV-01B', node_count: TOTAL_NODE_COUNT, connected: true, last_read: '14:30:01', last_write: '14:30:00', read_count: 148920, write_count: 1180, error_count: 2 },
  { instance_id: 'EQUIP-6F-003', instance_name: 'CV-02A', node_count: TOTAL_NODE_COUNT, connected: true, last_read: '14:30:00', last_write: '14:29:58', read_count: 145230, write_count: 1150, error_count: 0 },
  { instance_id: 'EQUIP-6F-004', instance_name: 'CV-02B', node_count: TOTAL_NODE_COUNT, connected: false, last_read: '13:45:22', last_write: '13:44:10', read_count: 98450, write_count: 890, error_count: 47 },
]

export const MOCK_GATEWAY_LOGS: GatewayLog[] = [
  { id: 1, timestamp: '14:30:01', level: 'INFO', source: 'CV-01A', message: `5개 카테고리 노드 ${TOTAL_NODE_COUNT}개 Read 완료 (18ms)` },
  { id: 2, timestamp: '14:30:01', level: 'INFO', source: 'CV-01B', message: `5개 카테고리 노드 ${TOTAL_NODE_COUNT}개 Read 완료 (22ms)` },
  { id: 3, timestamp: '14:29:55', level: 'WARN', source: 'CV-02B', message: 'Connection timeout — 재연결 시도 (3/5)' },
  { id: 4, timestamp: '14:29:50', level: 'ERROR', source: 'CV-02B', message: 'BadConnectionClosed: PLC 응답 없음 (172.19.17.54:502)' },
  { id: 5, timestamp: '14:29:45', level: 'INFO', source: 'Server', message: 'Historian-Agent 세션 갱신 (sess-004)' },
  { id: 6, timestamp: '14:29:30', level: 'INFO', source: 'CV-01A', message: 'Temperature/UpTabHeat Write 요청: 190.0°C → 완료' },
  { id: 7, timestamp: '14:29:15', level: 'WARN', source: 'CV-02B', message: 'Connection timeout — 재연결 시도 (2/5)' },
  { id: 8, timestamp: '14:28:50', level: 'ERROR', source: 'CV-02B', message: 'BadConnectionClosed: PLC 응답 없음 (172.19.17.54:502)' },
  { id: 9, timestamp: '14:28:30', level: 'INFO', source: 'Server', message: 'SCADA-Client 구독 갱신 — monitored items: 60' },
  { id: 10, timestamp: '14:28:00', level: 'INFO', source: 'CV-01B', message: 'Time/1stMTwaittime Write 요청: 15.0sec → 완료' },
]

// ─── Node count helpers ───
function countNodes(node: OpcuaNode): { total: number; variable: number; object: number } {
  let total = 1
  let variable = node.node_class === 'Variable' ? 1 : 0
  let object = node.node_class === 'Object' ? 1 : 0
  for (const child of node.children ?? []) {
    const c = countNodes(child)
    total += c.total
    variable += c.variable
    object += c.object
  }
  return { total, variable, object }
}
export const MOCK_NODE_STATS = countNodes(MOCK_OPCUA_TREE)
