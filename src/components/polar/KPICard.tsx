import React from 'react';
import { Circle, ChevronDown } from 'lucide-react';

export interface PolarKPICardProps {
  title: string;
  value: string;
  hasDropdown?: boolean;
  actionLink?: string;
  dateRanges?: string[];
  showChart?: boolean;
  chartData?: number[];
  xAxisLabels?: string[];
  showDots?: boolean;
  activeDot?: number;
  contentText?: {
    primary?: string;
    secondary?: string;
  };
  compact?: boolean;
  statusColor?: {
    bg: string;
    text?: string;
    border?: string;
    icon?: React.ReactNode;
  };
}

export function PolarKPICard({ 
  title,
  value,
  hasDropdown = false,
  actionLink,
  dateRanges = [],
  showChart = false,
  chartData = [],
  xAxisLabels = [],
  showDots = false,
  activeDot = 0,
  contentText,
  compact = false,
  statusColor,
}: PolarKPICardProps) {
  
  // Calculate chart line points
  const chartHeight = 140;
  const maxValue = Math.max(...chartData, 1);
  const minValue = Math.min(...chartData, 0);
  const range = maxValue - minValue || 1;
  
  const points = chartData.map((value, index) => {
    const x = (index / Math.max(chartData.length - 1, 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 85;
    return { x, y };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Compact variant - small card with optional status
  if (compact) {
    return (
      <div
        className="rounded-polar-lg"
        style={{
          backgroundColor: statusColor?.bg || '#FFF7ED',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          height: '100%',
          minHeight: '140px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: '#636878',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {statusColor?.icon && (
            <span style={{ color: statusColor.text, display: 'flex', alignItems: 'center' }}>
              {statusColor.icon}
            </span>
          )}
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '32px',
            fontWeight: 600,
            color: '#282E3A',
            letterSpacing: '-0.01em',
            lineHeight: '1',
            marginTop: '4px',
          }}
        >
          {value}
        </div>
        {contentText?.primary && (
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#282E3A',
              marginTop: '4px',
            }}
          >
            {contentText.primary}
          </div>
        )}
        {contentText?.secondary && (
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              color: '#636878',
            }}
          >
            {contentText.secondary}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-polar-lg"
      style={{
        backgroundColor: statusColor?.bg || '#FFFFFF',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '320px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: '#282E3A',
            }}
          >
            {title}
          </span>
          {hasDropdown && (
            <ChevronDown size={16} style={{ color: '#636878' }} />
          )}
        </div>
        {actionLink && (
          <button
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: '#282E3A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {actionLink}
          </button>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '56px',
          fontWeight: 600,
          color: '#282E3A',
          letterSpacing: '-0.02em',
          lineHeight: '1',
          marginBottom: dateRanges.length > 0 ? '20px' : '24px',
        }}
      >
        {value}
      </div>

      {/* Date Ranges */}
      {dateRanges.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          {dateRanges.map((range, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Circle
                size={8}
                fill="#E27726"
                stroke="none"
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#36373A',
                }}
              >
                {range}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Content Text */}
      {contentText && !showChart && (
        <div style={{ marginTop: 'auto' }}>
          {contentText.primary && (
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                color: statusColor?.text || '#282E3A',
                marginBottom: contentText.secondary ? '4px' : '0',
              }}
            >
              {contentText.primary}
            </div>
          )}
          {contentText.secondary && (
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#36373A',
              }}
            >
              {contentText.secondary}
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <div
          className="rounded-polar-lg"
          style={{
            marginTop: 'auto',
            backgroundColor: '#FFFFFF',
            padding: '24px',
          }}
        >
          <div style={{ height: `${chartHeight}px`, width: '100%', marginBottom: '12px' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ display: 'block' }}
            >
              <line 
                x1="0" y1="100" x2="100" y2="100" 
                stroke="#ECEDED" strokeWidth="1" vectorEffect="non-scaling-stroke"
              />
              {chartData.length > 1 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#E27726"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
                />
              )}
            </svg>
          </div>
          {xAxisLabels.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {xAxisLabels.map((label, index) => (
                <span key={index} style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 400, color: '#36373A' }}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dot indicators */}
      {showDots && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === activeDot ? '#E27726' : '#ECEDED',
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
