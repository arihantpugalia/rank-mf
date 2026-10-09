'use client';

import React from 'react';
import { CategorySummary as CategorySummaryType } from '@/lib/types';

interface CategorySummaryProps {
  categories: CategorySummaryType[];
}

export function CategorySummary({ categories }: CategorySummaryProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-ink tracking-tight">SEBI Category Breakdown</h3>
        <p className="text-sm text-mute mt-1">Cross-sectional overview of funds analyzed, qualified, and top 3 leaders per asset class.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div key={cat.category} className="bg-canvas border border-hairline rounded-xl p-5 hover:border-mute transition-all shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand px-2 py-0.5 bg-brand/5 border border-brand/10 rounded">
                  {cat.category}
                </span>
                <span className="text-xs font-mono font-medium text-mute">
                  {cat.rankable_funds} / {cat.funds_screened} active
                </span>
              </div>

              <div className="border-t border-hairline my-3" />

              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-mute uppercase tracking-wider">Top Ranked Schemes</div>
                <div className="space-y-2">
                  {cat.top_3.map((fund, idx) => {
                    if (!fund || fund === 'N/A') return null;

                    const badges = [
                      'bg-amber-100 text-amber-900 border-amber-300 font-bold',
                      'bg-slate-200 text-slate-800 border-slate-300 font-bold',
                      'bg-amber-700/10 text-amber-800 border-amber-700/20 font-bold',
                    ];

                    return (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0 border mt-0.5 ${badges[idx] || 'bg-hairline text-body'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs text-ink font-medium leading-tight">
                          {fund}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-hairline-soft flex items-center justify-between text-[11px] text-mute">
              <span>Not Rankable:</span>
              <span className="font-semibold text-ink">{cat.not_rankable}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
