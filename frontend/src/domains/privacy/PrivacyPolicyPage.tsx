/**
 * 개인정보처리방침 페이지.
 */
export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: '#1e293b' }}>
        개인정보처리방침
      </h1>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>1. 개인정보의 처리 목적</h2>
        <p style={paragraph}>
          본 시스템은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는
          다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
          「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
        </p>
        <ul style={listStyle}>
          <li>시스템 접근 관리 및 사용자 인증</li>
          <li>서비스 이용에 따른 본인 식별 및 인증</li>
          <li>시스템 보안 및 감사 로그 관리</li>
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>2. 개인정보의 처리 및 보유 기간</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>수집 항목</th>
              <th style={thStyle}>보유 기간</th>
              <th style={thStyle}>근거</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>사용자명, 이름, 이메일</td>
              <td style={tdStyle}>회원 탈퇴 시 또는 비활성 1년 후 익명화</td>
              <td style={tdStyle}>개인정보보호법 제21조</td>
            </tr>
            <tr>
              <td style={tdStyle}>로그인 시도 기록 (IP, 시간)</td>
              <td style={tdStyle}>180일</td>
              <td style={tdStyle}>정보통신망법 제15조의2</td>
            </tr>
            <tr>
              <td style={tdStyle}>시스템 접근 로그</td>
              <td style={tdStyle}>365일</td>
              <td style={tdStyle}>정보통신망법 제15조의2</td>
            </tr>
            <tr>
              <td style={tdStyle}>개인정보 처리 감사 로그</td>
              <td style={tdStyle}>730일 (2년)</td>
              <td style={tdStyle}>개인정보보호법 제29조</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>3. 개인정보의 제3자 제공</h2>
        <p style={paragraph}>
          본 시스템은 정보주체의 개인정보를 제3자에게 제공하지 않습니다.
          다만, 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여
          불가피한 경우에는 예외로 합니다.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>4. 개인정보의 안전성 확보 조치</h2>
        <ul style={listStyle}>
          <li>개인정보 암호화: AES-256-GCM 알고리즘으로 DB 저장 시 암호화</li>
          <li>비밀번호 일방향 암호화: PBKDF2WithHmacSHA512 (10만 반복)</li>
          <li>전송 구간 암호화: TLS 1.2 이상</li>
          <li>접근 통제: 역할 기반 접근 제어(RBAC) 및 메뉴별 권한 관리</li>
          <li>접근 로그: 개인정보 조회/수정/삭제 감사 로그 기록</li>
          <li>쿠키 보안: HttpOnly + Secure + SameSite=Strict</li>
          <li>API 응답 마스킹: 이름, 이메일 등 개인정보 마스킹 처리</li>
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>5. 정보주체의 권리·의무 및 행사방법</h2>
        <p style={paragraph}>
          정보주체는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를
          행사할 수 있으며, 시스템 관리자에게 요청하실 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>6. 개인정보 보호책임자</h2>
        <p style={paragraph}>
          개인정보 처리에 관한 업무를 총괄하는 개인정보 보호책임자는 다음과 같습니다.
        </p>
        <ul style={listStyle}>
          <li>담당부서: 시스템 운영팀</li>
          <li>연락처: 시스템 관리자에게 문의</li>
        </ul>
      </section>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 40 }}>
        본 방침은 시행일로부터 적용됩니다.
      </p>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 8,
};

const paragraph: React.CSSProperties = {
  fontSize: 14,
  color: '#475569',
  lineHeight: 1.7,
};

const listStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#475569',
  lineHeight: 1.8,
  paddingLeft: 20,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#f1f5f9',
  borderBottom: '2px solid #e2e8f0',
  textAlign: 'left',
  fontWeight: 600,
  color: '#334155',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
};
