import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
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

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-red-900 text-white p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <h2 className="text-xl font-semibold mb-2">Error:</h2>
          <pre className="bg-black/50 p-4 rounded mb-4 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
          <h2 className="text-xl font-semibold mb-2">Component Stack:</h2>
          <pre className="bg-black/50 p-4 rounded whitespace-pre-wrap text-sm">
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
