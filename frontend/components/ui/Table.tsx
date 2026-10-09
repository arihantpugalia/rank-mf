import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortBy,
  sortOrder = 'desc',
  onSort,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto border border-hairline rounded-md bg-elevated ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-hairline bg-canvas">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && onSort?.(column.key)}
                className={`
                  px-md py-sm text-xs font-semibold uppercase tracking-wider text-mute
                  ${column.sortable ? 'cursor-pointer select-none hover:text-ink' : ''}
                  ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                `}
              >
                <div
                  className={`flex items-center gap-1 ${
                    column.align === 'right'
                      ? 'justify-end'
                      : column.align === 'center'
                      ? 'justify-center'
                      : 'justify-start'
                  }`}
                >
                  <span>{column.header}</span>
                  {column.sortable && sortBy === column.key && (
                    <span className="text-ink font-mono text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-md py-lg text-center text-mute body-md">
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                className="hover:bg-canvas/50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-md py-sm body-md text-ink
                      ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                    `}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as Record<string, any>)[column.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
