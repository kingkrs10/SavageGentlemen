import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  // When an error occurs, update state with error details
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Log error details for debugging and monitoring
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, we would send this to an error monitoring service
    // like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example of code to send to monitoring service:
      // reportErrorToService(error, errorInfo);
      
      // For now, just log to console in production
      console.error(
        'Production Error:',
        error.name,
        error.message,
        error.stack,
        errorInfo.componentStack
      );
    }
    
    this.setState({ errorInfo });
  }

  // Reset the error state to attempt recovery
  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  // Reload the entire page for a fresh start
  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    // If there's no error, render children normally
    if (!this.state.hasError) {
      return this.props.children;
    }

    // If a custom fallback was provided, use it
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default error UI
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <div className="w-20 h-20 text-red-500 mb-4">
          <AlertTriangle className="w-full h-full" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-white/70 mb-6 max-w-md">
          We've encountered an unexpected error. Our team has been notified.
        </p>
        
        {/* Production error message is simplified */}
        {process.env.NODE_ENV !== 'production' && this.state.error && (
          <div className="bg-black/30 p-4 rounded mb-6 text-left overflow-auto max-w-3xl w-full">
            <p className="text-red-400 font-mono mb-2">{this.state.error.toString()}</p>
            {this.state.errorInfo && (
              <pre className="text-xs text-white/60 font-mono">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>
        )}
        
        <div className="flex gap-4">
          <Button onClick={this.handleReset} variant="outline">
            Try Again
          </Button>
          <Button onClick={this.handleReload}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;