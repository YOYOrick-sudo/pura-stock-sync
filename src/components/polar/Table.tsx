import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PolarTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

export interface PolarTableProps {
  columns: PolarTableColumn[];
  data: Record<string, any>[];
  emptyMessage?: string;
}

const alignClasses = {
  left: 'text-left justify-start',
  center: 'text-center justify-center',
  right: 'text-right justify-end',
} as const;

export function PolarTable({ columns, data, emptyMessage = 'No Results' }: PolarTableProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div
        className="gap-6 px-6 py-3 border-b border-border bg-muted"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'flex items-center gap-1 text-sm font-normal text-foreground',
              alignClasses[column.align || 'left'],
            )}
          >
            {column.label}
            {column.sortable && (
              <ChevronDown size={14} className="text-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Table Body - Empty State */}
      {data.length === 0 && (
        <div className="py-16 px-6 text-center text-sm font-normal text-foreground bg-card">
          {emptyMessage}
        </div>
      )}

      {/* Table Body - With Data */}
      {data.length > 0 && (
        <div>
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                'gap-6 px-6 py-4 bg-card',
                rowIndex < data.length - 1 && 'border-b border-border',
              )}
              style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    'text-sm font-normal text-foreground',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                  )}
                >
                  {row[column.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
