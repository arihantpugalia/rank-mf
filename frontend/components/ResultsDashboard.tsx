'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CategorySummary } from '@/components/CategorySummary';
import { TopFundsTable } from '@/components/TopFundsTable';
import { useScreenerStore } from '@/lib/store';
import { getDownloadUrl } from '@/lib/api';

type Tab = 'top3' | 'all' | 'categories';

export function ResultsDashboard() {
  const { results, jobId, reset } = useScreenerStore();
  const [activeTab, setActiveTab] = useState<Tab>('top3');

  if (!results) return null;

  const tabs = [
    { key: 'top3', label: 'Top 3 By Category', icon: '🏆' },
    { key: 'all', label: 'All Ranked Funds', icon: '📊' },
    { key: 'categories', label: 'Category Metrics', icon: '📈' },
  ] as const;

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

      {/* Executive Header */}
      <div className="bg-elevated border border-hairline rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">Screener Rankings</h2>
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
              Completed
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-mute">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{new Date(results.generated_at).toLocaleString()}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-hairline" />
            <div className="flex items-center gap-1.5 text-mute">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-mono text-xs bg-canvas px-1.5 py-0.5 rounded border border-hairline">{results.filter_summary}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {jobId && (
            <a
              href={getDownloadUrl(jobId)}
              download
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-ink text-white text-sm font-semibold hover:bg-brand transition-all shadow-md shadow-ink/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Excel
            </a>
          )}
          <button
            onClick={reset}
            className="px-6 h-12 rounded-full bg-canvas border border-hairline hover:bg-hairline-soft transition-colors text-ink text-sm font-semibold"
          >
            New Pass
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Rankable Schemes', value: results.categories.reduce((s, c) => s + c.rankable_funds, 0), color: 'text-brand' },
          { label: 'Categories Ranked', value: results.categories.length, color: 'text-ink' },
          {
            label: 'Total Analyzed',
            value: results.categories.reduce((s, c) => s + c.funds_screened, 0),
            color: 'text-ink'
          },
          {
            label: 'Not Rankable (Missing Data)',
            value: results.categories.reduce((s, c) => s + c.not_rankable, 0),
            color: 'text-orange-500'
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-canvas border border-hairline rounded-xl p-5 hover:border-mute transition-colors shadow-sm">
            <div className="text-xs font-medium text-mute mb-2 uppercase tracking-wide">{stat.label}</div>
            <div className={`text-3xl font-bold tracking-tight tabular-nums ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-canvas rounded-xl p-1.5 flex flex-wrap gap-1 border border-hairline shadow-inner max-w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                ${isActive
                  ? 'bg-elevated text-ink shadow-sm border border-hairline-soft'
                  : 'text-mute hover:text-ink hover:bg-hairline-soft/50 border border-transparent'}
              `}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Container */}
      <div className="bg-elevated border border-hairline rounded-2xl shadow-sm overflow-hidden">
        {/* Tab Content */}
        {activeTab === 'top3' && results.top_funds && (
          <div className="p-1">
            <TopFundsTable funds={results.top_funds} defaultSort="category" />
          </div>
        )}
        {activeTab === 'all' && (
          <div className="p-1">
            <TopFundsTable
              funds={results.all_rankable && results.all_rankable.length > 0 ? results.all_rankable : (results.top_funds || [])}
              defaultSort="overall_score"
              enableCategoryFilter
            />
          </div>
        )}
        {activeTab === 'categories' && (
          <div className="p-6 md:p-8">
            <CategorySummary categories={results.categories} />
          </div>
        )}
      </div>

    </div>
  );
}
