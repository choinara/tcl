import { useMemo } from 'react';

interface Props {
  password: string;
}

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: '12자 이상', test: (pw) => pw.length >= 12 },
  { label: '대문자 포함', test: (pw) => /[A-Z]/.test(pw) },
  { label: '소문자 포함', test: (pw) => /[a-z]/.test(pw) },
  { label: '숫자 포함', test: (pw) => /[0-9]/.test(pw) },
  { label: '특수문자 포함', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
  { label: '연속 4자 이상 불가', test: (pw) => !hasConsecutiveChars(pw, 4) },
];

function hasConsecutiveChars(str: string, count: number): boolean {
  if (str.length < count) return false;
  for (let i = 0; i <= str.length - count; i++) {
    const base = str.charCodeAt(i);
    let consecutive = true;
    for (let j = 1; j < count; j++) {
      if (str.charCodeAt(i + j) !== base + j) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;

    // 역순 연속 체크
    consecutive = true;
    for (let j = 1; j < count; j++) {
      if (str.charCodeAt(i + j) !== base - j) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }
  return false;
}

export function PasswordStrengthIndicator({ password }: Props) {
  const results = useMemo(
    () => RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );

  const passedCount = results.filter((r) => r.passed).length;
  const strength = useMemo(() => {
    if (!password) return { label: '', color: '#e2e8f0', width: 0 };
    if (passedCount <= 2) return { label: '약함', color: '#ef4444', width: 25 };
    if (passedCount <= 4) return { label: '보통', color: '#f59e0b', width: 50 };
    if (passedCount <= 5) return { label: '강함', color: '#22c55e', width: 75 };
    return { label: '매우 강함', color: '#16a34a', width: 100 };
  }, [password, passedCount]);

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {/* 강도 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            backgroundColor: '#e2e8f0',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${strength.width}%`,
              height: '100%',
              backgroundColor: strength.color,
              transition: 'width 0.3s, background-color 0.3s',
              borderRadius: 2,
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: strength.color, fontWeight: 600, minWidth: 60 }}>
          {strength.label}
        </span>
      </div>

      {/* 규칙 체크리스트 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
        {results.map((rule) => (
          <span
            key={rule.label}
            style={{
              fontSize: 11,
              color: rule.passed ? '#16a34a' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>{rule.passed ? '✓' : '○'}</span>
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}
