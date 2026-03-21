import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Surface the error for debugging in the Lovable console
    // eslint-disable-next-line no-console
    console.error("AppErrorBoundary caught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6">
          <h1 className="text-2xl font-display">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Reload
            </button>
          </div>

          {this.state.error?.message ? (
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          ) : null}
        </section>
      </main>
    );
  }
}
