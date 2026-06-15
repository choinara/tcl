import type { PipelineStatus } from '../../shared/types';

const C_GREEN  = '#22c55e';
const C_RED    = '#ef4444';
const C_GRAY   = '#94a3b8';
const C_YELLOW = '#f59e0b';
const C_BLUE   = '#3b82f6';
const C_PURPLE = '#8b5cf6';
const C_ORANGE = '#f97316';

function connColor(s: string) {
  return s === 'CONNECTED' ? C_GREEN : s === 'DISCONNECTED' ? C_RED : C_GRAY;
}

// ── 아이콘 (중심 0,0, 가시 반경 ≈ 24px) ────────────────────────────────────

function PlcIcon({ c }: { c: string }) {
  return (
    <g>
      {/* 본체 */}
      <rect x={-22} y={-22} width={44} height={44} rx={6} fill={c} opacity={0.18}/>
      {/* DIN 레일 */}
      <rect x={-18} y={-18} width={36} height={6} rx={2} fill={c} opacity={0.75}/>
      {/* 상태 LED */}
      <circle cx={-10} cy={-5} r={4.5} fill="#22c55e"/>
      <circle cx={0}   cy={-5} r={4.5} fill="#22c55e"/>
      <circle cx={10}  cy={-5} r={4.5} fill="#f59e0b"/>
      {/* 터미널 스트립 */}
      {([-16,-10,-4,2,8,14] as number[]).map(x => (
        <rect key={x} x={x} y={5} width={4} height={12} rx={1} fill={c} opacity={0.8}/>
      ))}
    </g>
  );
}

function GwIcon({ c }: { c: string }) {
  return (
    <g>
      {/* 라우터 본체 */}
      <rect x={-24} y={-8} width={48} height={20} rx={5} fill={c} opacity={0.85}/>
      {/* 안테나 */}
      <line x1={-14} y1={-8} x2={-18} y2={-24} stroke={c} strokeWidth={2.5}/>
      <circle cx={-18} cy={-24} r={3.5} fill={c} opacity={0.7}/>
      <line x1={14} y1={-8} x2={18} y2={-24} stroke={c} strokeWidth={2.5}/>
      <circle cx={18} cy={-24} r={3.5} fill={c} opacity={0.7}/>
      {/* 포트 LED */}
      {([-16,-9,-2,5,12] as number[]).map((x, i) => (
        <rect key={x} x={x} y={-4} width={4} height={12} rx={1}
          fill="white" opacity={i < 3 ? 0.9 : 0.4}/>
      ))}
    </g>
  );
}

function ServerIcon({ c }: { c: string }) {
  return (
    <g>
      {([0,10,20] as number[]).map((dy, i) => (
        <g key={dy}>
          <rect x={-22} y={-20+dy} width={44} height={8} rx={2} fill={c} opacity={0.55+i*0.12}/>
          <circle cx={16} cy={-16+dy} r={3} fill={i < 2 ? '#22c55e' : '#f59e0b'}/>
          <rect x={-18} y={-19+dy} width={24} height={2} rx={1} fill="white" opacity={0.3}/>
        </g>
      ))}
    </g>
  );
}

function RedisIcon({ c }: { c: string }) {
  return (
    <g>
      <ellipse cx={0} cy={-14} rx={20} ry={6} fill={c} opacity={0.9}/>
      <rect x={-20} y={-14} width={40} height={26} fill={c} opacity={0.3}/>
      <ellipse cx={0} cy={12} rx={20} ry={6} fill={c} opacity={0.75}/>
      <line x1={-20} y1={-14} x2={-20} y2={12} stroke={c} strokeWidth={1.5}/>
      <line x1={20}  y1={-14} x2={20}  y2={12} stroke={c} strokeWidth={1.5}/>
      {/* 번개 볼트 (즉시·캐시) */}
      <polygon points="4,-9 -3,2 2,2 -4,12 7,0 2,0" fill="white" opacity={0.95}/>
    </g>
  );
}

function QueueIcon({ c, fill }: { c: string; fill: number }) {
  return (
    <g>
      {([4,2,0] as number[]).map((dy, i) => (
        <rect key={dy} x={-20+i*2} y={-16+dy} width={40} height={22} rx={3}
          fill="white" stroke={c} strokeWidth={1.8} opacity={0.85}/>
      ))}
      {/* 사용률 바 */}
      <rect x={-15} y={8} width={30} height={5} rx={2} fill="#e2e8f0"/>
      <rect x={-15} y={8} width={Math.max(2, 30*fill)} height={5} rx={2} fill={c}/>
    </g>
  );
}

function TsdbIcon({ c }: { c: string }) {
  return (
    <g>
      <ellipse cx={0} cy={-18} rx={20} ry={6} fill={c} opacity={0.9}/>
      <rect x={-20} y={-18} width={40} height={36} fill={c} opacity={0.28}/>
      <ellipse cx={0} cy={-8}  rx={20} ry={6} fill={c} opacity={0.5}/>
      <ellipse cx={0} cy={2}   rx={20} ry={6} fill={c} opacity={0.62}/>
      <ellipse cx={0} cy={18}  rx={20} ry={6} fill={c} opacity={0.85}/>
      <line x1={-20} y1={-18} x2={-20} y2={18} stroke={c} strokeWidth={1.5}/>
      <line x1={20}  y1={-18} x2={20}  y2={18} stroke={c} strokeWidth={1.5}/>
    </g>
  );
}

function PendingIcon({ c }: { c: string }) {
  return (
    <g>
      <polygon points="0,-22 20,12 -20,12" fill={c} opacity={0.2} stroke={c} strokeWidth={2}/>
      <text x={0} y={7} textAnchor="middle" dominantBaseline="middle"
        fontSize={18} fontWeight={900} fill={c}>!</text>
    </g>
  );
}

function DashIcon({ c }: { c: string }) {
  return (
    <g>
      <rect x={-24} y={-18} width={48} height={32} rx={4} fill={c} opacity={0.65}/>
      <rect x={-20} y={-15} width={40} height={24} rx={2} fill="white" opacity={0.92}/>
      {([[-14,11],[-8,7],[0,16],[8,9],[14,13]] as [number,number][]).map(([x,h],i) => (
        <rect key={i} x={x-3} y={9-h} width={6} height={h} rx={1}
          fill={i%2===0 ? C_BLUE : C_GREEN} opacity={0.85}/>
      ))}
      <rect x={-5}  y={14}  width={10} height={5}  fill={c} opacity={0.65}/>
      <rect x={-12} y={19}  width={24} height={3}  rx={1} fill={c} opacity={0.65}/>
    </g>
  );
}

function AiIcon({ c }: { c: string }) {
  return (
    <g>
      {[0,60,120,180,240,300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        const ox = Math.cos(rad)*22, oy = Math.sin(rad)*22;
        return (
          <g key={deg}>
            <line x1={0} y1={0} x2={ox} y2={oy} stroke={c} strokeWidth={1.5} opacity={0.4}/>
            <circle cx={ox} cy={oy} r={5.5} fill={c} opacity={0.62}/>
          </g>
        );
      })}
      <circle cx={0} cy={0} r={11} fill={c} opacity={0.9}/>
      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fontWeight={900} fill="white">AI</text>
    </g>
  );
}

// ── 박스 없는 아이콘 노드 (cx,cy = 중심) ────────────────────────────────────
function Node({ cx, cy, color, icon, title, sub, pulse }: {
  cx: number; cy: number; color: string;
  icon: React.ReactNode; title: string; sub?: string; pulse?: boolean;
}) {
  return (
    <g filter="url(#nd-shadow)">
      {/* 펄스 링 (활성 노드) */}
      {pulse && (
        <circle cx={cx} cy={cy} r={30} fill="none" stroke={color} strokeWidth={2} opacity={0}>
          <animate attributeName="r"       values="30;44;30" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      )}
      {/* 원형 글로우 배경 */}
      <circle cx={cx} cy={cy} r={30} fill={`${color}22`}/>
      {/* 아이콘 */}
      <g transform={`translate(${cx},${cy})`}>{icon}</g>
      {/* 레이블 */}
      <text x={cx} y={cy+42} textAnchor="middle" dominantBaseline="middle"
        fontSize={11} fontWeight={700} fill="#111827">{title}</text>
      {sub && (
        <text x={cx} y={cy+55} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill="#6b7280">{sub}</text>
      )}
    </g>
  );
}

// ── 레이블 (박스 없음, 텍스트만 — 흰 외곽선으로 가독성 확보) ──────────────
function Label({ x, y, lines, color = '#111827' }: {
  x: number; y: number; lines: string[]; color?: string;
}) {
  const lh = 13;
  return (
    <g>
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - (lines.length - 1) * (lh / 2) + i * lh}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fontWeight={700} fill={color}
          stroke="white" strokeWidth={3} paintOrder="stroke">{l}</text>
      ))}
    </g>
  );
}

// ── 흐름 dot ───────────────────────────────────────────────────────────────
function FlowDot({ path, color, dur, begin = '0s', r = 4 }: {
  path: string; color: string; dur: string; begin?: string; r?: number;
}) {
  return (
    <circle r={r} fill={color} opacity={0.85}>
      <animateMotion dur={dur} repeatCount="indefinite" begin={begin} path={path}/>
    </circle>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function PipelineTopologyChart({ status }: { status: PipelineStatus | null }) {
  const usage     = status?.queue_usage_percent ?? 0;
  const qColor    = status?.queue_full ? C_RED : usage > 80 ? C_YELLOW : C_GREEN;
  const rColor    = connColor(status?.redis_status ?? 'NOT_CONFIGURED');
  const tColor    = connColor(status?.timescaledb_status ?? 'NOT_CONFIGURED');
  const qSub      = status
    ? `${status.queue_size.toLocaleString()}/${status.queue_capacity.toLocaleString()} (${usage.toFixed(1)}%)`
    : '-/-';
  const fillRatio = usage / 100;

  // 노드 중심 좌표 (cx, cy)  / 연결 반경 R = 30
  // plc(82,210) edge(252,210) api(440,210)
  // redis(638,90)  bqueue(638,228)  tsdb(850,210)  pending(850,362)
  // ui(1068,90)    ai(1068,228)

  // 연결선 path (아이콘 경계에서 시작/종료)
  const P_PLC_EDGE    = 'M 112,210 L 222,210';
  const P_EDGE_API    = 'M 282,210 L 410,210';
  const P_API_REDIS   = 'M 470,200 C 502,200 502,90 608,90';
  const P_API_BQUEUE  = 'M 470,218 L 608,228';
  const P_BQUEUE_TSDB = 'M 668,226 L 820,214';
  const P_BQUEUE_PEND = 'M 638,258 C 638,308 850,308 850,332';
  const P_REDIS_UI    = 'M 668,90 L 1038,90';
  const P_REDIS_AI    = 'M 668,83 C 822,83 822,213 1038,213';
  const P_TSDB_UI     = 'M 880,198 C 908,198 908,102 1038,102';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 1200 445" width="100%" style={{ display: 'block', minWidth: 960 }}>
        <defs>
          <filter id="nd-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#00000018"/>
          </filter>
          {([
            ['a-blue',   C_BLUE],
            ['a-green',  C_GREEN],
            ['a-purple', C_PURPLE],
            ['a-orange', C_ORANGE],
          ] as [string, string][]).map(([id, fill]) => (
            <marker key={id} id={id} markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" fill={fill}/>
            </marker>
          ))}
        </defs>

        {/* ── 서버1 경계 (plc + edge) ── */}
        <rect x={14} y={168} width={288} height={100} rx={10}
          fill="rgba(59,130,246,0.04)" stroke={C_BLUE} strokeWidth={2} strokeDasharray="6,3"/>
        <rect x={22} y={160} width={142} height={17} rx={3} fill="white"/>
        <text x={28} y={172} fontSize={11} fontWeight={700} fill={C_BLUE}>서버1 · Edge 서버</text>

        {/* ── 서버2 경계 (api ~ ai) ── */}
        <rect x={378} y={20} width={756} height={415} rx={10}
          fill="rgba(34,197,94,0.03)" stroke="#16a34a" strokeWidth={2} strokeDasharray="6,3"/>
        <rect x={386} y={12} width={178} height={17} rx={3} fill="white"/>
        <text x={392} y={24} fontSize={11} fontWeight={700} fill="#16a34a">서버2 · 통합관제센터</text>

        {/* ── 연결선 ── */}

        {/* 1. PLC → Edge GW */}
        <line x1={112} y1={210} x2={222} y2={210}
          stroke={C_BLUE} strokeWidth={2} markerEnd="url(#a-blue)"/>
        <Label x={167} y={197} lines={['Modbus/TCP']}/>
        <FlowDot path={P_PLC_EDGE} color={C_BLUE} dur="0.7s"/>

        {/* 2. Edge GW → API Server */}
        <line x1={282} y1={210} x2={410} y2={210}
          stroke={C_BLUE} strokeWidth={2} markerEnd="url(#a-blue)"/>
        <Label x={346} y={196} lines={['HTTPS POST', '/api/opcua/ingest']}/>
        <FlowDot path={P_EDGE_API} color={C_BLUE} dur="0.9s" begin="0.2s"/>

        {/* 3. API → Redis (수신 즉시 직접 SET) */}
        <path d={P_API_REDIS}
          fill="none" stroke={C_GREEN} strokeWidth={2.5} markerEnd="url(#a-green)"/>
        <Label x={506} y={138} lines={['SET TTL 5분', '(T1 실시간·즉시)']} color={C_GREEN}/>
        <FlowDot path={P_API_REDIS} color={C_GREEN} dur="0.53s" begin="0.1s"/>

        {/* 4. API → BQueue */}
        <line x1={470} y1={218} x2={608} y2={228}
          stroke={C_BLUE} strokeWidth={2} markerEnd="url(#a-blue)"/>
        <Label x={538} y={217} lines={['offer()']}/>
        <FlowDot path={P_API_BQUEUE} color={C_BLUE} dur="1.1s" begin="0.7s"/>

        {/* 5. BQueue → TimescaleDB */}
        <line x1={668} y1={226} x2={820} y2={214}
          stroke={C_BLUE} strokeWidth={2} markerEnd="url(#a-blue)"/>
        <Label x={744} y={210} lines={['flush 5초', '(T1/T2/T3)']}/>
        <FlowDot path={P_BQUEUE_TSDB} color={C_BLUE} dur="2.2s" begin="1.1s"/>

        {/* 6. BQueue → PENDING (실패 경로, 점선·주황) */}
        <path d={P_BQUEUE_PEND}
          fill="none" stroke={C_ORANGE} strokeWidth={2}
          strokeDasharray="5,4" markerEnd="url(#a-orange)"/>
        <Label x={756} y={304} lines={['@Recover', '(3회 실패)']} color={C_ORANGE}/>
        <FlowDot path={P_BQUEUE_PEND} color={C_ORANGE} dur="3.5s" begin="0s" r={3}/>

        {/* 7. Redis → 통합관제센터 */}
        <line x1={668} y1={90} x2={1038} y2={90}
          stroke={C_PURPLE} strokeWidth={2} markerEnd="url(#a-purple)"/>
        <Label x={853} y={77} lines={['GET 실시간']} color={C_PURPLE}/>
        <FlowDot path={P_REDIS_UI} color={C_PURPLE} dur="0.67s" begin="0.15s"/>

        {/* 8. Redis → AI 서버 */}
        <path d={P_REDIS_AI}
          fill="none" stroke={C_PURPLE} strokeWidth={2} markerEnd="url(#a-purple)"/>
        <Label x={856} y={148} lines={['GET 실시간']} color={C_PURPLE}/>
        <FlowDot path={P_REDIS_AI} color={C_PURPLE} dur="0.87s" begin="0.3s"/>

        {/* 9. TimescaleDB → 통합관제센터 (이력 조회, 파선) */}
        <path d={P_TSDB_UI}
          fill="none" stroke={C_PURPLE} strokeWidth={2}
          strokeDasharray="6,4" markerEnd="url(#a-purple)"/>
        <Label x={978} y={150} lines={['이력 조회']} color={C_PURPLE}/>
        <FlowDot path={P_TSDB_UI} color={C_PURPLE} dur="3s" begin="1.8s" r={3}/>

        {/* ── 노드 (연결선 위에 렌더링) ── */}
        <Node cx={82}  cy={210} color={C_GREEN}  pulse
          icon={<PlcIcon c={C_GREEN}/>}    title="PLC×52"      sub="Modbus/TCP"/>
        <Node cx={252} cy={210} color={C_BLUE}   pulse
          icon={<GwIcon c={C_BLUE}/>}      title="Edge GW"     sub="[서버1]"/>

        <Node cx={440} cy={210} color={C_BLUE}   pulse
          icon={<ServerIcon c={C_BLUE}/>}  title="API Server"  sub="[서버2]"/>
        <Node cx={638} cy={90}  color={rColor}
          icon={<RedisIcon c={rColor}/>}   title="Redis"       sub={status?.redis_status ?? 'NOT_CONFIGURED'}/>
        <Node cx={638} cy={228} color={qColor}
          icon={<QueueIcon c={qColor} fill={fillRatio}/>} title="BQueue" sub={qSub}/>
        <Node cx={850} cy={210} color={tColor}
          icon={<TsdbIcon c={tColor}/>}    title="TimescaleDB" sub={status?.timescaledb_status ?? 'NOT_CONFIGURED'}/>
        <Node cx={850} cy={362} color={C_ORANGE}
          icon={<PendingIcon c={C_ORANGE}/>} title="PENDING"   sub="PostgreSQL"/>

        <Node cx={1068} cy={90}  color={C_PURPLE}
          icon={<DashIcon c={C_PURPLE}/>}  title="통합관제센터" sub="대시보드"/>
        <Node cx={1068} cy={228} color={C_PURPLE}
          icon={<AiIcon c={C_PURPLE}/>}    title="AI 서버"     sub="추론·학습"/>
      </svg>

      {/* ── 범례 ── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', fontSize: 11, color: '#111827' }}>
        {([
          [C_GREEN,  '정상 연결'],
          [C_YELLOW, '큐 80%↑ 경고'],
          [C_RED,    '연결 끊김'],
          [C_ORANGE, '실패 경로 (PENDING)'],
          [C_PURPLE, '소비자 (대시보드·AI)'],
        ] as [string, string][]).map(([c, t]) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: c }}/>
            {t}
          </span>
        ))}
        <span style={{ color: '#6b7280' }}>실선=즉시·실시간 · 파선=배치·이력 · 점선=실패경로 · ●=데이터 흐름</span>
      </div>
    </div>
  );
}
