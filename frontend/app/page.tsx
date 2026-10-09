'use client';

import React from 'react';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ProgressLog } from '@/components/ProgressLog';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { useScreenerStore } from '@/lib/store';

export default function Home() {
  const { status, jobId, reset } = useScreenerStore();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Sleek Header */}
      <nav className="border-b border-hairline bg-elevated sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-brand text-white flex items-center justify-center shadow-sm">
              <span className="font-mono text-sm font-bold leading-none tracking-tighter">MF</span>
            </div>
            <div>
              <div className="font-semibold text-ink leading-tight tracking-tight text-sm">Rank MF</div>
              <div className="text-xs text-mute font-medium">Quantitative Screener</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase">Live Data</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col">
        {status === 'idle' && <ConfigPanel />}
        {status === 'running' && <ProgressLog />}
        {status === 'completed' && <ResultsDashboard />}
        {status === 'failed' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-2xl border-2 border-red-100 bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-6 shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-ink tracking-tight mb-2">Execution Failed</h2>
            <p className="text-mute mb-8 leading-relaxed text-sm">
              The quantitative screening pipeline encountered an error. This may happen if the AMFI API is unresponsive, or the backend server is unreachable.
            </p>
            <button
              onClick={reset}
              className="px-8 h-11 rounded-full bg-brand text-white text-sm font-medium hover:bg-ink transition-colors shadow-sm"
            >
              Configure & Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-hairline py-8 bg-elevated mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-mute text-xs font-medium">
          <div className="flex items-center gap-2">
            <span>Data sourced from AMFI India APIs</span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-faint">
            FastAPI + Next.js App Router
          </div>
        </div>
      </footer>
    </div>
  );
}
