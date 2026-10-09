'use client';

import React, { useState, useMemo } from 'react';
import { FundResult } from '@/lib/types';

interface TopFundsTableProps {
  funds: FundResult[];
  title?: string;
  defaultSort?: string;
  enableCategoryFilter?: boolean;
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null || isNaN(score)) {
    return <span className="text-mute/40 font-mono text-xs">—</span>;
  }

  let colorClass = "bg-red-50 text-red-700 border-red-200";
  if (score >= 80) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
  else if (score >= 60) colorClass = "bg-green-50 text-green-700 border-green-200 font-semibold";
  else if (score >= 40) colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  else if (score >= 20) colorClass = "bg-orange-50 text-orange-700 border-orange-200";

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded font-mono text-xs border tabular-nums ${colorClass}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function TopFundsTable({
  funds,
  defaultSort = 'overall_score',
  enableCategoryFilter = false
}: TopFundsTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState(defaultSort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSort === 'rank' ? 'asc' : 'desc');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    funds.forEach((f) => { if (f.category) set.add(f.category); });
    return Array.from(set).sort();
  }, [funds]);

  // Filter
  const filtered = useMemo(() => {
    return funds.filter((f) => {
      const matchSearch =
        f.scheme_name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === 'ALL' || f.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [funds, search, categoryFilter]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let valA = (a as Record<string, any>)[sortBy];
      let valB = (b as Record<string, any>)[sortBy];

      if (valA === undefined || valA === null || (typeof valA === 'number' && isNaN(valA))) {
        valA = sortOrder === 'asc' ? Infinity : -Infinity;
      }
      if (valB === undefined || valB === null || (typeof valB === 'number' && isNaN(valB))) {
        valB = sortOrder === 'asc' ? Infinity : -Infinity;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return list;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder(key === 'rank' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  const headers = [
    { key: 'rank', label: 'Rank', align: 'text-center', sortable: true },
    { key: 'scheme_name', label: 'Scheme Name', align: 'text-left', sortable: true },
    { key: 'category', label: 'Category', align: 'text-left', sortable: true },
    { key: 'overall_score', label: 'Overall Score', align: 'text-center', sortable: true },
    { key: 'sharpe_score', label: 'Sharpe', align: 'text-center', sortable: true },
    { key: 'sortino_score', label: 'Sortino', align: 'text-center', sortable: true },
    { key: 'up_cap_score', label: 'Up Cap', align: 'text-center', sortable: true },
    { key: 'down_cap_score', label: 'Down Cap', align: 'text-center', sortable: true },
    { key: 'rolling_score', label: 'Rolling Ret', align: 'text-center', sortable: true },
    { key: 'fund_age', label: 'Age (Yrs)', align: 'text-center', sortable: true },
  ];

  return (
    <div className="flex flex-col">
      {/* Table Controls Header */}
      <div className="p-4 md:p-6 border-b border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search scheme name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-64 bg-canvas border border-hairline rounded-lg px-3.5 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:border-brand transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-mute hover:text-ink text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {enableCategoryFilter && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              className="bg-canvas border border-hairline rounded-lg px-3.5 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-mute font-medium">
          Showing <span className="text-ink font-semibold">{filtered.length}</span> funds
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-canvas border-b border-hairline text-[11px] font-bold text-mute uppercase tracking-wider">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => h.sortable && handleSort(h.key)}
                  className={`px-4 py-3.5 select-none ${h.align} ${h.sortable ? 'cursor-pointer hover:text-ink' : ''}`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${h.align === 'text-center' ? 'justify-center' : ''}`}>
                    <span>{h.label}</span>
                    {sortBy === h.key && (
                      <span className="text-brand font-mono text-xs">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-mute">
                  No funds match your filter criteria.
                </td>
              </tr>
            ) : (
              paginated.map((fund, idx) => {
                const isTop3 = fund.rank <= 3;
                return (
                  <tr key={`${fund.category}-${fund.rank}-${fund.scheme_name}`} className="hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-mono text-xs font-bold ${isTop3 ? 'bg-brand text-white shadow-sm' : 'text-mute'}`}>
                        {fund.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-ink truncate" title={fund.scheme_name}>
                        {fund.scheme_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-body whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-canvas border border-hairline font-medium text-mute">
                        {fund.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      <ScoreBadge score={fund.overall_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={fund.sharpe_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={fund.sortino_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={fund.up_cap_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={fund.down_cap_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={fund.rolling_score} />
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-mute">
                      {fund.fund_age !== undefined && fund.fund_age !== null ? fund.fund_age.toFixed(1) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-hairline flex items-center justify-between bg-canvas/40">
          <div className="text-xs text-mute">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3.5 py-1.5 rounded-lg border border-hairline bg-elevated text-xs font-semibold text-ink hover:bg-hairline-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3.5 py-1.5 rounded-lg border border-hairline bg-elevated text-xs font-semibold text-ink hover:bg-hairline-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
