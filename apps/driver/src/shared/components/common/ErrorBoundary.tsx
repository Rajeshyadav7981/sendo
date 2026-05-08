import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Top-of-tree boundary so the driver app shows a recovery screen instead of
 * a blank white page if any descendant throws. The Retry button clears the
 * error state — useful because most of the time it's a transient network
 * blip, not a real crash.
 */
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
          <div className="p-6 max-w-md mx-auto text-sm">
            <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
            <p className="text-neutral-500 mb-3">
              The app hit a runtime error. Tap Retry, or close and reopen the app.
            </p>
            <pre className="bg-neutral-100 p-3 rounded text-xs overflow-auto mb-4">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              className="px-4 py-2 rounded bg-yellow-400 text-black font-medium"
              onClick={() => {
                this.setState({ error: null });
              }}
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
