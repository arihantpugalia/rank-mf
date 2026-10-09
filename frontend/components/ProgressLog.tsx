'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getJobStatus } from '@/lib/api';
import { useScreenerStore } from '@/lib/store';

export function ProgressLog() {
  const { jobId, setCompleted, setFailed } = useScreenerStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());

  // Determine stage based on logs
  let stage = 1;
  const logString = logs.join(' ');
  if (logString.includes('Report successfully saved')) stage = 5;
  else if (logString.includes('calculating metrics')) stage = 4;
  else if (logString.includes('Benchmark Index')) stage = 3;
  else if (logString.includes('Risk-Free Rate')) stage = 2;

  useEffect(() => {
    if (!jobId) return;

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);
        setLogs(status.progress || []);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          clearInterval(timer);

          // Fetch results
          const { getResults } = await import('@/lib/api');
          try {
            const results = await getResults(jobId);
            setCompleted(results);
          } catch {
            setFailed();
          }
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          clearInterval(timer);
          setFailed();
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timer);
    };
  }, [jobId, setCompleted, setFailed]);

  // Auto-scroll log viewer
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatElapsed = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const stages = [
    { num: 1, label: 'Master List & Context' },
    { num: 2, label: 'Risk-Free Rates' },
    { num: 3, label: 'Benchmarks & Indices' },
    { num: 4, label: 'NAV Calculation Engine' },
    { num: 5, label: 'Compilation & Excel' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-hairline">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-40"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
            </div>
            <h2 className="text-2xl font-semibold text-ink tracking-tight">Pipeline Executing</h2>
          </div>
          <p className="text-sm text-mute">
            Fetching NAV histories, computing multi-factor datasets, and ranking by percentile.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="font-mono text-3xl font-medium text-ink tabular-nums tracking-tighter">
            {formatElapsed(elapsed)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-mute font-semibold">Time Elapsed</div>
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stages.map((s) => {
          const isActive = stage === s.num;
          const isPast = stage > s.num;

          return (
            <div
              key={s.num}
              className={`
                px-4 py-3 rounded-xl border flex flex-col gap-1 transition-all
                ${isActive ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105 z-10' : ''}
                ${isPast ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
                ${!isActive && !isPast ? 'bg-canvas border-hairline text-mute opacity-70' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${isActive ? 'text-white/80' : isPast ? 'text-emerald-500' : 'text-faint'}`}>
                  0{s.num}
                </span>
                {isPast && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </div>
              <div className={`text-[11px] font-semibold tracking-wide uppercase leading-tight ${isActive ? 'text-white' : ''}`}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Block */}
      <div className="rounded-2xl overflow-hidden border border-[#27272a] shadow-2xl bg-[#18181b] mt-4 flex flex-col">
        {/* Fake MacOS Header */}
        <div className="h-10 bg-[#27272a] flex items-center px-4 gap-2 border-b border-[#3f3f46]">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
          <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
          <div className="ml-4 font-mono text-[11px] text-[#a1a1aa] flex-1 text-center pr-12">
            screener_engine.py — stdout
          </div>
        </div>

        {/* Console Body */}
        <div
          ref={scrollRef}
          className="p-5 h-96 overflow-y-auto custom-scrollbar font-mono text-xs md:text-sm text-[#d4d4d8] scroll-smooth"
        >
          {logs.length === 0 ? (
            <div className="flex items-center text-[#71717a] h-full justify-center">
              <span className="animate-pulse">Waiting for process attachment...</span>
            </div>
          ) : (
            <div className="space-y-1.5 pb-4">
              {logs.map((line, index) => {
                // Style lines based on content
                let lineClass = "text-[#d4d4d8]";
                let prefix = "→";

                if (line.includes('Fetching AMFI')) {
                  lineClass = "text-[#60a5fa]"; // Blue
                  prefix = "↓";
                } else if (line.includes('Locked Eva') || line.includes('Total funds')) {
                  lineClass = "text-[#a78bfa]"; // Purple
                  prefix = "ℹ";
                } else if (line.includes('Report successfully')) {
                  lineClass = "text-[#34d399] font-semibold"; // Green
                  prefix = "✓";
                } else if (line.includes('calculating metrics')) {
                  lineClass = "text-[#f472b6]"; // Pink
                  prefix = "⚡";
                } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
                  lineClass = "text-[#f87171]"; // Red
                  prefix = "⨯";
                }

                return (
                  <div key={index} className="flex hover:bg-[#27272a]/50 px-2 py-0.5 rounded transition-colors break-all">
                    <span className="text-[#52525b] select-none w-8 shrink-0 text-right mr-4 text-[10px] mt-0.5">
                      {index + 1}
                    </span>
                    <span className={`w-4 shrink-0 font-bold select-none ${lineClass}`}>{prefix}</span>
                    <span className={`flex-1 ${lineClass}`}>{line}</span>
                  </div>
                );
              })}
              {stage < 5 && (
                <div className="flex px-2 py-0.5 items-center gap-2 mt-2">
                  <span className="text-[#52525b] select-none w-8 shrink-0 text-right mr-4 text-[10px]">
                    ...
                  </span>
                  <span className="w-2 h-4 bg-[#d4d4d8] animate-pulse"></span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
