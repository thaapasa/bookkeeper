import * as React from 'react';

export type ErrorBoundaryFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

type ErrorBoundaryProps = {
  fallbackRender: (props: ErrorBoundaryFallbackProps) => React.ReactNode;
  /** When any value in this array changes, the error state is automatically cleared. */
  resetKeys?: readonly unknown[];
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

// Error boundaries require class components — React has no hook equivalent.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.error &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, i) => key !== prevProps.resetKeys![i])
    ) {
      this.setState({ error: null });
    }
  }

  resetErrorBoundary = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallbackRender({
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      });
    }
    return this.props.children;
  }
}
