import React from 'react';
import { ChevronDown } from 'lucide-react';

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

export function PolarTable({ columns, data, emptyMessage = 'No Results' }: PolarTableProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div
        className="bg-muted border-b border-border"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: '24px',
          padding: '12px 24px',
        }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="text-sm text-foreground flex items-center gap-1"
            style={{
              textAlign: column.align || 'left',
              justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start',
            }}
          >
            {column.label}
            {column.sortable && (
              <ChevronDown size={14} className="text-foreground" />
            )}
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="p-16 text-center text-sm text-muted-foreground bg-card">
          {emptyMessage}
        </div>
      )}

      {data.length > 0 && (
        <div>
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="bg-card border-b border-border last:border-b-0"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                gap: '24px',
                padding: '16px 24px',
              }}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="text-sm text-foreground"
                  style={{ textAlign: column.align || 'left' }}
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
