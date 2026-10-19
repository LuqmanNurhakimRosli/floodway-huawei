import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** What failed, for the message ("This screen", "The 3D studio"). */
  what?: string;
}
interface State {
  error: Error | null;
}

/**
 * Catches a crash in one screen so the app shows a way out instead of a blank page. The rest of the app keeps working;
 * App.tsx resets the boundary when the route changes.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('FloodWay screen error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-6 text-center shadow-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-3 font-heading text-xl font-bold text-slate-900">{this.props.what ?? 'This screen'} stopped working</h1>
          <p className="mt-2 text-sm/6 text-slate-600">
            The rest of FloodWay still works. Try again, or go back to Home. For a real emergency call 999.
          </p>
          <p className="mt-3 break-words rounded-xl bg-slate-50 p-2 font-mono text-xs text-slate-600">{error.message.slice(0, 160)}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#0958D9] px-4 text-sm font-bold text-white hover:bg-[#003EB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
            <a
              href="/home"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
            >
              <Home className="h-4 w-4" aria-hidden="true" /> Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

/** True when the browser can create a WebGL context (the 3D studio needs one). */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
