import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 全局错误边界 - 捕获子组件树中的 JS 错误
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Result
            status="error"
            title="页面出错了"
            subTitle="抱歉，页面渲染时发生了未知错误。"
            extra={[
              <Button key="retry" type="primary" onClick={this.handleReset}>
                重试
              </Button>,
              <Button key="home" onClick={() => (window.location.href = '/')}>
                返回首页
              </Button>,
            ]}
          />
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: 24, textAlign: 'left', maxWidth: 600, margin: '24px auto' }}>
              <summary style={{ cursor: 'pointer', color: '#999' }}>错误详情</summary>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 12 }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// 局部错误边界 - 用于包裹独立功能模块，降级显示
export function SectionErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback || <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>该模块加载失败</div>}>
      {children}
    </ErrorBoundary>
  );
}
