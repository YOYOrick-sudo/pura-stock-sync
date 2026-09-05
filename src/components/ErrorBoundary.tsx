import { Component, type ReactNode } from 'react';
import { devError } from '@/lib/devLog';

interface State {
  fout: boolean;
}

/** Vangnet rond de app: één fout mag nooit het hele scherm wit maken. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { fout: false };

  static getDerivedStateFromError(): State {
    return { fout: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    devError('ErrorBoundary', error, info);
  }

  render() {
    if (this.state.fout) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <p className="text-lg font-semibold">Er ging iets mis</p>
          <p className="text-sm text-muted-foreground">
            Het scherm liep vast. Ververs de app en probeer het opnieuw.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-polar-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Ververs de app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
