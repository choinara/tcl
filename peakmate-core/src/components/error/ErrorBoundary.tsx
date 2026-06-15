import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    this.setState({
      errorInfo: errorInfo.componentStack || '',
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error } = this.state;
      const errorMessage = error?.message || '알 수 없는 오류';

      // API 에러 코드별 메시지
      let userMessage = '예상치 못한 오류가 발생했습니다';
      let suggestion = '페이지를 새로고침하거나 관리자에게 문의하세요.';

      if (errorMessage.includes('401') || errorMessage.includes('인증')) {
        userMessage = '인증이 만료되었습니다';
        suggestion = '다시 로그인해주세요.';
      } else if (errorMessage.includes('403') || errorMessage.includes('권한')) {
        userMessage = '접근 권한이 없습니다';
        suggestion = '관리자에게 권한을 요청하세요.';
      } else if (errorMessage.includes('404')) {
        userMessage = '페이지를 찾을 수 없습니다';
        suggestion = '주소가 올바른지 확인해주세요.';
      } else if (errorMessage.includes('429')) {
        userMessage = '요청이 너무 많습니다';
        suggestion = '잠시 후 다시 시도해주세요.';
      } else if (errorMessage.includes('500') || errorMessage.includes('서버')) {
        userMessage = '서버 오류가 발생했습니다';
        suggestion = '일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = '네트워크 연결에 문제가 있습니다';
        suggestion = '인터넷 연결을 확인하고 다시 시도해주세요.';
      }

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
          }}
        >
          <h1 style={{ fontSize: 72, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Oops</h1>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#334155', margin: '8px 0 4px' }}>
            {userMessage}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>{suggestion}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              aria-label="다시 시도"
              style={{
                padding: '8px 24px',
                fontSize: 14,
                color: '#fff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <button
              onClick={this.handleGoHome}
              aria-label="메인으로 이동"
              style={{
                padding: '8px 24px',
                fontSize: 14,
                color: '#475569',
                backgroundColor: '#e2e8f0',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              메인으로
            </button>
            <button
              onClick={() => window.location.reload()}
              aria-label="페이지 새로고침"
              style={{
                padding: '8px 24px',
                fontSize: 14,
                color: '#475569',
                backgroundColor: '#e2e8f0',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
