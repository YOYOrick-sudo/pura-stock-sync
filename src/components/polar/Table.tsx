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
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5D8E0',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: '24px',
          padding: '12px 24px',
          borderBottom: '1px solid #EAECF0',
          backgroundColor: '#F8F9FA',
        }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: '#282E3A',
              textAlign: column.align || 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start',
              gap: '4px',
            }}
          >
            {column.label}
            {column.sortable && (
              <ChevronDown size={14} style={{ color: '#282E3A' }} />
            )}
          </div>
        ))}
      </div>

      {/* Table Body - Empty State */}
      {data.length === 0 && (
        <div
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#282E3A',
            backgroundColor: '#FFFFFF',
          }}
        >
          {emptyMessage}
        </div>
      )}

      {/* Table Body - With Data */}
      {data.length > 0 && (
        <div>
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                gap: '24px',
                padding: '16px 24px',
                borderBottom: rowIndex < data.length - 1 ? '1px solid #EAECF0' : 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#282E3A',
                    textAlign: column.align || 'left',
                  }}
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
