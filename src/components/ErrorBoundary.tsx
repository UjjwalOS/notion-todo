import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] p-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
              <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
            </div>

            <h1 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
              Something went wrong
            </h1>

            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Show error message in development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 rounded-md bg-[var(--color-bg-tertiary)] p-4 text-left">
                <p className="mb-1 text-xs font-medium text-[var(--color-text-tertiary)]">
                  Error Details (Development Only)
                </p>
                <pre className="overflow-auto text-xs text-[var(--color-danger)]">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
