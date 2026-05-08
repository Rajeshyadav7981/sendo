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
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="sendo-page">
            <h2 className="sendo-heading">Something went wrong</h2>
            <div className="sendo-section">
              <pre className="overflow-auto text-sm">{this.state.error.message}</pre>
              <button
                type="button"
                className="sendo-btn-yellow mt-4"
                onClick={() => this.setState({ error: null })}
              >
                Retry
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
