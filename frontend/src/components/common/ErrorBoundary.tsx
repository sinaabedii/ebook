import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="mb-6 p-4 rounded-full bg-red-500/10">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">
            خطایی رخ داده است
          </h2>
          
          <p className="text-slate-400 mb-6 max-w-md">
            متأسفانه در بارگذاری این بخش مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="w-full max-w-lg mb-6 p-4 bg-slate-800/50 rounded-lg text-left overflow-auto">
              <p className="text-red-400 font-mono text-sm mb-2">
                {this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <pre className="text-slate-500 text-xs overflow-x-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <button
            onClick={this.handleRetry}
            className="control-btn-primary flex items-center gap-2 px-6 py-3"
          >
            <RefreshCw className="w-5 h-5" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified error message component
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'خطا',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="control-btn-primary flex items-center gap-2 px-4 py-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تلاش مجدد</span>
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;
