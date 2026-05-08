import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: '1.5rem', fontFamily: 'system-ui', maxWidth: '40rem' }}>
            <h1 style={{ fontSize: '1.1rem' }}>Something went wrong</h1>
            <p style={{ color: '#525252', fontSize: '0.9rem' }}>
              The app hit a runtime error. Open the browser console (F12 → Console) for the full
              stack trace.
            </p>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.8rem',
              }}
            >
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              className="sup-btn sup-btn-amber"
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
