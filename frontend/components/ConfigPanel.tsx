'use client';

import React, { useState } from 'react';
import { useScreenerStore } from '@/lib/store';
import { runScreener } from '@/lib/api';

const AVAILABLE_METRICS = [
  'Sharpe',
  'Sortino',
  'Up Capture',
  'Down Capture',
  'Rolling Returns',
];

const AVAILABLE_TIMEFRAMES = ['1y', '3y', '5y'];

export function ConfigPanel() {
  const { config, setConfig, startJob, setFailed } = useScreenerStore();
  const [useSubset, setUseSubset] = useState(false);
  const [subsetCount, setSubsetCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMetric = (metric: string) => {
    if (config.metrics.includes(metric)) {
      setConfig({ ...config, metrics: config.metrics.filter((m) => m !== metric) });
    } else {
      setConfig({ ...config, metrics: [...config.metrics, metric] });
    }
  };

  const toggleTimeframe = (tf: string) => {
    if (config.timeframes.includes(tf)) {
      setConfig({ ...config, timeframes: config.timeframes.filter((t) => t !== tf) });
    } else {
      setConfig({ ...config, timeframes: [...config.timeframes, tf] });
    }
  };

  const handleRun = async () => {
    if (config.metrics.length === 0) {
      setError('Please select at least one metric to rank by.');
      return;
    }
    if (config.timeframes.length === 0) {
      setError('Please select at least one timeframe to evaluate.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...config,
        subset_limit: useSubset ? (Number(subsetCount) || 20) : undefined,
      };

      const response = await runScreener(payload);
      startJob(response.job_id);
    } catch (err: any) {
      console.error('Failed to start screener:', err);
      setError(err?.message || 'Failed to start screener run. Is the backend server running?');
      setFailed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-elevated p-8 md:p-12 shadow-sm">
        <div className="absolute inset-0 bg-mesh-gradient opacity-80 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="text-[11px] font-semibold text-brand tracking-widest uppercase mb-3 px-2.5 py-1 bg-brand/5 border border-brand/10 inline-block rounded-full">
            Quantitative Framework
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4 leading-tight">
            Indian Equity Mutual Fund<br/>Quantitative Screener
          </h1>
          <p className="text-base text-body leading-relaxed max-w-2xl">
            Multi-factor percentile ranking model across SEBI equity categories. Evaluates Risk-Adjusted Returns (Sharpe, Sortino), Market Capture (Up/Down), and Rolling Consistency (1Y, 3Y, 5Y).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Metrics */}
          <div className="bg-elevated border border-hairline rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-1 tracking-tight">Return & Risk Metrics</h2>
            <p className="text-sm text-mute mb-5">Select the quantitative indicators to include in the composite score.</p>

            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_METRICS.map((metric) => {
                const isSelected = config.metrics.includes(metric);
                return (
                  <button
                    key={metric}
                    onClick={() => toggleMetric(metric)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2
                      ${isSelected
                        ? 'bg-ink text-white border-ink shadow-md shadow-ink/10'
                        : 'bg-canvas text-body border-hairline hover:border-mute hover:bg-hairline-soft'}
                    `}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {metric}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeframes */}
          <div className="bg-elevated border border-hairline rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-1 tracking-tight">Evaluation Horizons</h2>
            <p className="text-sm text-mute mb-5">Select the trailing periods used to compute the indicators.</p>

            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_TIMEFRAMES.map((tf) => {
                const isSelected = config.timeframes.includes(tf);
                return (
                  <button
                    key={tf}
                    onClick={() => toggleTimeframe(tf)}
                    className={`
                      px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2
                      ${isSelected
                        ? 'bg-ink text-white border-ink shadow-md shadow-ink/10'
                        : 'bg-canvas text-body border-hairline hover:border-mute hover:bg-hairline-soft'}
                    `}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {tf.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="bg-elevated border border-hairline rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-5 tracking-tight">Execution Settings</h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={config.month_end}
                    onChange={(e) => setConfig({ ...config, month_end: e.target.checked })}
                    className="peer w-5 h-5 appearance-none border border-mute rounded bg-canvas checked:bg-brand checked:border-brand transition-colors cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white left-1 top-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink group-hover:text-brand transition-colors">Month-End NAV Alignment</div>
                  <div className="text-sm text-mute mt-0.5">Locks prices to the most recently completed month (Morningstar/AMFI standard parity).</div>
                </div>
              </label>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={useSubset}
                      onChange={(e) => setUseSubset(e.target.checked)}
                      className="peer w-5 h-5 appearance-none border border-mute rounded bg-canvas checked:bg-brand checked:border-brand transition-colors cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white left-1 top-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink group-hover:text-brand transition-colors">Fast Test Mode</div>
                    <div className="text-sm text-mute mt-0.5">Limit the number of processed schemes for rapid debugging.</div>
                  </div>
                </label>

                {useSubset && (
                  <div className="ml-8 mt-3">
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={subsetCount}
                      onChange={(e) => setSubsetCount(Number(e.target.value))}
                      className="w-32 bg-canvas border border-hairline rounded-md px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-mute transition-colors shadow-inner"
                      placeholder="e.g. 20"
                    />
                    <span className="text-xs text-mute ml-3">Max funds to compute</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50/50 border border-red-100 rounded-lg text-red-600 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full sm:w-auto px-8 h-12 rounded-full bg-brand text-white text-base font-semibold hover:bg-ink transition-all shadow-md shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Booting Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Run Quantitative Screener</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Methodology */}
        <div className="space-y-6">
          <div className="bg-canvas border border-hairline rounded-xl p-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-mute mb-2">Methodology</div>
            <h3 className="text-base font-semibold text-ink mb-4">How Scoring Works</h3>
            <ul className="text-sm text-body space-y-3">
              <li className="flex gap-2">
                <span className="text-brand shrink-0 mt-0.5">•</span>
                <span><strong>Percentile Ranking:</strong> Computed purely cross-sectionally within identical SEBI categories (0-100 scale).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand shrink-0 mt-0.5">•</span>
                <span><strong>Capture Ratios:</strong> Annualized geometric up and down market capture computed against precise TRI benchmarks.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand shrink-0 mt-0.5">•</span>
                <span><strong>Direct Growth Only:</strong> Regular, IDCW, and closed-ended formats are algorithmically purged.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand shrink-0 mt-0.5">•</span>
                <span><strong>Penalty Rules:</strong> Missing any selected data point immediately moves a fund to 'Not Rankable'.</span>
              </li>
            </ul>
          </div>

          <div className="bg-canvas border border-hairline rounded-xl p-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-mute mb-2">Benchmark Map</div>
            <h3 className="text-base font-semibold text-ink mb-4">Category Proxies</h3>
            <div className="text-[13px] text-body space-y-2 font-mono bg-elevated border border-hairline p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-mute truncate pr-2">Large Cap</span>
                <span className="text-ink font-semibold shrink-0">Nifty 50 TRI</span>
              </div>
              <div className="flex justify-between border-t border-hairline-soft pt-2">
                <span className="text-mute truncate pr-2">Mid Cap</span>
                <span className="text-ink font-semibold shrink-0">Midcap 150</span>
              </div>
              <div className="flex justify-between border-t border-hairline-soft pt-2">
                <span className="text-mute truncate pr-2">Small Cap</span>
                <span className="text-ink font-semibold shrink-0">Smallcap 250</span>
              </div>
              <div className="flex justify-between border-t border-hairline-soft pt-2">
                <span className="text-mute truncate pr-2">Flexi/Multi</span>
                <span className="text-ink font-semibold shrink-0">Nifty 500 TRI</span>
              </div>
              <div className="flex justify-between border-t border-hairline-soft pt-2">
                <span className="text-mute truncate pr-2">Risk Free Rate</span>
                <span className="text-ink font-semibold shrink-0">Liquid Fund</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
